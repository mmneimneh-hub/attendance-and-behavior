BEGIN;

-- Freeze legacy JSON saves for this short transaction so a concurrent browser
-- cannot write attendance after the copy step but before the cleanup trigger.
LOCK TABLE public.school_state IN SHARE ROW EXCLUSIVE MODE;

-- Notification delivery state belongs to the attendance row. Keeping it in
-- school_state duplicated the largest part of the application state and made
-- every attendance edit transfer and replace the entire JSON document.
ALTER TABLE public.attendance_entries
  ADD COLUMN IF NOT EXISTS notification_id text,
  ADD COLUMN IF NOT EXISTS notification_method text,
  ADD COLUMN IF NOT EXISTS notification_status text,
  ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.attendance_entries'::regclass
      AND conname = 'attendance_entries_notification_method_check'
  ) THEN
    ALTER TABLE public.attendance_entries
      ADD CONSTRAINT attendance_entries_notification_method_check
      CHECK (notification_method IS NULL OR notification_method IN ('WhatsApp', 'SMS', 'Email'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.attendance_entries'::regclass
      AND conname = 'attendance_entries_notification_status_check'
  ) THEN
    ALTER TABLE public.attendance_entries
      ADD CONSTRAINT attendance_entries_notification_status_check
      CHECK (notification_status IS NULL OR notification_status IN ('pending', 'sent', 'failed', 'dismissed'));
  END IF;
END
$$;

-- Capture any attendance changes written by a legacy browser after the first
-- attendance_entries migration and before this migration removes the duplicate.
WITH expanded AS (
  SELECT
    academic_year.key AS academic_year,
    semester.key AS semester,
    class_entry.key AS class_id,
    date_entry.key AS attendance_date,
    student_entry.key AS student_id,
    student_entry.value AS record
  FROM public.school_state AS state
  CROSS JOIN LATERAL jsonb_each(COALESCE(state.data -> 'academicYears', '{}'::jsonb)) AS academic_year
  CROSS JOIN LATERAL jsonb_each(COALESCE(academic_year.value -> 'semesters', '{}'::jsonb)) AS semester
  CROSS JOIN LATERAL jsonb_each(COALESCE(semester.value -> 'attendance', '{}'::jsonb)) AS class_entry
  CROSS JOIN LATERAL jsonb_each(COALESCE(class_entry.value, '{}'::jsonb)) AS date_entry
  CROSS JOIN LATERAL jsonb_each(COALESCE(date_entry.value, '{}'::jsonb)) AS student_entry
  WHERE state.singleton = true
    AND academic_year.key ~ '^\d{4}-\d{4}$'
    AND semester.key IN ('1', '2')
    AND date_entry.key ~ '^\d{4}-\d{2}-\d{2}$'
), normalized AS (
  SELECT
    academic_year,
    semester::smallint AS semester,
    class_id,
    student_id,
    attendance_date::date AS attendance_date,
    CASE
      WHEN record ->> 'status' IN ('present', 'absent', 'tardy', 'early') THEN record ->> 'status'
      ELSE 'present'
    END AS status,
    record,
    CASE
      WHEN COALESCE(record ->> 'updatedAt', '') ~ '^\d{4}-\d{2}-\d{2}T'
        THEN (record ->> 'updatedAt')::timestamptz
      ELSE now()
    END AS record_updated_at
  FROM expanded
)
INSERT INTO public.attendance_entries (
  academic_year, semester, class_id, student_id, attendance_date,
  status, absence_type, note, updated_by, updated_by_email,
  updated_by_name, updated_at
)
SELECT
  academic_year,
  semester,
  class_id,
  student_id,
  attendance_date,
  status,
  CASE WHEN status = 'absent'
    THEN CASE WHEN record ->> 'absenceType' = 'unexcused' THEN 'unexcused' ELSE 'excused' END
    ELSE NULL
  END,
  COALESCE(record ->> 'note', ''),
  NULLIF(record ->> 'updatedBy', ''),
  NULLIF(record ->> 'updatedByEmail', ''),
  NULLIF(record ->> 'updatedByName', ''),
  record_updated_at
FROM normalized
ON CONFLICT (academic_year, semester, class_id, student_id, attendance_date)
DO UPDATE SET
  status = EXCLUDED.status,
  absence_type = EXCLUDED.absence_type,
  note = EXCLUDED.note,
  updated_by = EXCLUDED.updated_by,
  updated_by_email = EXCLUDED.updated_by_email,
  updated_by_name = EXCLUDED.updated_by_name,
  updated_at = EXCLUDED.updated_at
WHERE EXCLUDED.updated_at >= public.attendance_entries.updated_at;

-- Preserve the best legacy notification for each attendance row. Nested
-- semester state is authoritative; the top-level list is included for older
-- data shapes and then de-duplicated.
WITH nested_notifications AS (
  SELECT
    academic_year.key AS academic_year,
    semester.key::smallint AS semester,
    notification.value AS item
  FROM public.school_state AS state
  CROSS JOIN LATERAL jsonb_each(COALESCE(state.data -> 'academicYears', '{}'::jsonb)) AS academic_year
  CROSS JOIN LATERAL jsonb_each(COALESCE(academic_year.value -> 'semesters', '{}'::jsonb)) AS semester
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(semester.value -> 'notifications') = 'array'
      THEN semester.value -> 'notifications' ELSE '[]'::jsonb END
  ) AS notification
  WHERE state.singleton = true
    AND academic_year.key ~ '^\d{4}-\d{4}$'
    AND semester.key IN ('1', '2')
), top_level_notifications AS (
  SELECT
    state.data ->> 'activeAcademicYear' AS academic_year,
    (state.data ->> 'activeSemester')::smallint AS semester,
    notification.value AS item
  FROM public.school_state AS state
  CROSS JOIN LATERAL jsonb_array_elements(
    CASE WHEN jsonb_typeof(state.data -> 'notifications') = 'array'
      THEN state.data -> 'notifications' ELSE '[]'::jsonb END
  ) AS notification
  WHERE state.singleton = true
    AND state.data ->> 'activeAcademicYear' ~ '^\d{4}-\d{4}$'
    AND state.data ->> 'activeSemester' IN ('1', '2')
), ranked_notifications AS (
  SELECT
    academic_year,
    semester,
    item ->> 'classId' AS class_id,
    item ->> 'studentId' AS student_id,
    (item ->> 'date')::date AS attendance_date,
    NULLIF(item ->> 'id', '') AS notification_id,
    CASE WHEN item ->> 'method' IN ('WhatsApp', 'SMS', 'Email')
      THEN item ->> 'method' ELSE 'WhatsApp' END AS notification_method,
    CASE WHEN item ->> 'status' IN ('pending', 'sent', 'failed')
      THEN item ->> 'status' ELSE 'pending' END AS notification_status,
    CASE WHEN COALESCE(item ->> 'sentAt', '') ~ '^\d{4}-\d{2}-\d{2}T'
      THEN (item ->> 'sentAt')::timestamptz ELSE NULL END AS notification_sent_at,
    row_number() OVER (
      PARTITION BY academic_year, semester, item ->> 'classId', item ->> 'studentId', item ->> 'date'
      ORDER BY CASE item ->> 'status' WHEN 'sent' THEN 3 WHEN 'failed' THEN 2 ELSE 1 END DESC
    ) AS preference
  FROM (
    SELECT * FROM nested_notifications
    UNION ALL
    SELECT * FROM top_level_notifications
  ) AS legacy
  WHERE item ->> 'classId' IS NOT NULL
    AND item ->> 'studentId' IS NOT NULL
    AND item ->> 'date' ~ '^\d{4}-\d{2}-\d{2}$'
)
UPDATE public.attendance_entries AS attendance
SET
  notification_id = COALESCE(notification.notification_id,
    'attendance-' || attendance.academic_year || '-' || attendance.semester || '-' ||
    attendance.class_id || '-' || attendance.attendance_date || '-' || attendance.student_id),
  notification_method = notification.notification_method,
  notification_status = notification.notification_status,
  notification_sent_at = notification.notification_sent_at
FROM ranked_notifications AS notification
WHERE notification.preference = 1
  AND attendance.academic_year = notification.academic_year
  AND attendance.semester = notification.semester
  AND attendance.class_id = notification.class_id
  AND attendance.student_id = notification.student_id
  AND attendance.attendance_date = notification.attendance_date
  AND attendance.notification_status IS NULL;

-- Records that require parent contact but have no legacy notification become
-- pending so the normalized table fully reconstructs the notification screen.
UPDATE public.attendance_entries
SET
  notification_id = COALESCE(notification_id,
    'attendance-' || academic_year || '-' || semester || '-' || class_id || '-' || attendance_date || '-' || student_id),
  notification_method = COALESCE(notification_method, 'WhatsApp'),
  notification_status = 'pending'
WHERE status IN ('absent', 'tardy', 'early')
  AND notification_status IS NULL;

CREATE OR REPLACE FUNCTION app_private.strip_attendance_payload(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
DECLARE
  cleaned jsonb;
  cleaned_years jsonb := '{}'::jsonb;
  cleaned_semesters jsonb;
  academic_year record;
  semester record;
BEGIN
  IF payload IS NULL OR jsonb_typeof(payload) <> 'object' THEN
    RETURN payload;
  END IF;

  cleaned := payload - 'attendance' - 'notifications';

  IF jsonb_typeof(payload -> 'academicYears') = 'object' THEN
    FOR academic_year IN SELECT key, value FROM jsonb_each(payload -> 'academicYears') LOOP
      IF jsonb_typeof(academic_year.value -> 'semesters') = 'object' THEN
        cleaned_semesters := '{}'::jsonb;
        FOR semester IN SELECT key, value FROM jsonb_each(academic_year.value -> 'semesters') LOOP
          cleaned_semesters := cleaned_semesters || jsonb_build_object(
            semester.key,
            CASE WHEN jsonb_typeof(semester.value) = 'object'
              THEN semester.value - 'attendance' - 'notifications'
              ELSE semester.value END
          );
        END LOOP;
        cleaned_years := cleaned_years || jsonb_build_object(
          academic_year.key,
          jsonb_set(academic_year.value, '{semesters}', cleaned_semesters, true)
        );
      ELSE
        cleaned_years := cleaned_years || jsonb_build_object(academic_year.key, academic_year.value);
      END IF;
    END LOOP;
    cleaned := jsonb_set(cleaned, '{academicYears}', cleaned_years, true);
  END IF;

  IF jsonb_typeof(payload -> 'durableActivity') = 'object' THEN
    cleaned := jsonb_set(cleaned, '{durableActivity}', (payload -> 'durableActivity') - 'attendance', true);
  END IF;

  RETURN cleaned;
END
$$;

CREATE OR REPLACE FUNCTION app_private.strip_school_state_attendance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.data := app_private.strip_attendance_payload(NEW.data);
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS school_state_strip_attendance ON public.school_state;
CREATE TRIGGER school_state_strip_attendance
BEFORE INSERT OR UPDATE OF data ON public.school_state
FOR EACH ROW EXECUTE FUNCTION app_private.strip_school_state_attendance();

UPDATE public.school_state
SET
  data = app_private.strip_attendance_payload(data),
  updated_at = now()
WHERE singleton = true
  AND data IS DISTINCT FROM app_private.strip_attendance_payload(data);

NOTIFY pgrst, 'reload schema';

COMMIT;
