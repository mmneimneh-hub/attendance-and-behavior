BEGIN;

-- Keep client synchronization to one tiny row. A statement-level trigger
-- increments the revision once for a batch insert, update, or delete.
CREATE TABLE IF NOT EXISTS public.attendance_sync_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  revision bigint NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.attendance_sync_state (singleton, revision)
VALUES (true, 1)
ON CONFLICT (singleton) DO NOTHING;

GRANT SELECT ON public.attendance_sync_state TO authenticated;

ALTER TABLE public.attendance_sync_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_sync_state_read ON public.attendance_sync_state;
CREATE POLICY attendance_sync_state_read ON public.attendance_sync_state
  FOR SELECT TO authenticated
  USING (app_private.current_app_role() IS NOT NULL);

CREATE OR REPLACE FUNCTION app_private.bump_attendance_revision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.attendance_sync_state (singleton, revision, updated_at)
  VALUES (true, 1, now())
  ON CONFLICT (singleton) DO UPDATE
  SET revision = public.attendance_sync_state.revision + 1,
      updated_at = EXCLUDED.updated_at;
  RETURN NULL;
END
$$;

DROP TRIGGER IF EXISTS attendance_entries_revision ON public.attendance_entries;
CREATE TRIGGER attendance_entries_revision
AFTER INSERT OR UPDATE OR DELETE ON public.attendance_entries
FOR EACH STATEMENT EXECUTE FUNCTION app_private.bump_attendance_revision();

CREATE INDEX IF NOT EXISTS attendance_entries_class_date_idx
  ON public.attendance_entries (academic_year, semester, class_id, attendance_date);
CREATE INDEX IF NOT EXISTS attendance_entries_notification_idx
  ON public.attendance_entries (academic_year, semester, class_id, notification_status)
  WHERE notification_status IS NOT NULL AND notification_status <> 'dismissed';

-- Attendance users do not need behavior cases, behavior audit history, or
-- behavior settings. Strip those server-side so they never cross the network.
CREATE OR REPLACE FUNCTION app_private.strip_behavior_payload(payload jsonb)
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

  cleaned := payload - 'behaviorSettings';
  IF jsonb_typeof(payload -> 'academicYears') = 'object' THEN
    FOR academic_year IN SELECT key, value FROM jsonb_each(payload -> 'academicYears') LOOP
      IF jsonb_typeof(academic_year.value -> 'semesters') = 'object' THEN
        cleaned_semesters := '{}'::jsonb;
        FOR semester IN SELECT key, value FROM jsonb_each(academic_year.value -> 'semesters') LOOP
          cleaned_semesters := cleaned_semesters || jsonb_build_object(
            semester.key,
            CASE WHEN jsonb_typeof(semester.value) = 'object'
              THEN semester.value - 'behavior'
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
    cleaned := jsonb_set(cleaned, '{durableActivity}', (payload -> 'durableActivity') - 'behavior', true);
  END IF;

  RETURN cleaned;
END
$$;

CREATE OR REPLACE FUNCTION public.school_state_for_app(p_include_behavior boolean DEFAULT false)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
SELECT jsonb_build_object(
  'data', CASE WHEN p_include_behavior THEN data ELSE app_private.strip_behavior_payload(data) END,
  'updated_at', updated_at,
  'updated_by', updated_by,
  'content_hash', md5((CASE WHEN p_include_behavior THEN data ELSE app_private.strip_behavior_payload(data) END)::text)
)
FROM public.school_state
WHERE singleton = true
$$;

CREATE OR REPLACE FUNCTION public.school_state_app_meta(p_include_behavior boolean DEFAULT false)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
SELECT jsonb_build_object(
  'updated_at', updated_at,
  'updated_by', updated_by,
  'content_hash', md5((CASE WHEN p_include_behavior THEN data ELSE app_private.strip_behavior_payload(data) END)::text)
)
FROM public.school_state
WHERE singleton = true
$$;

REVOKE ALL ON FUNCTION public.school_state_for_app(boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.school_state_app_meta(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.school_state_for_app(boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.school_state_app_meta(boolean) TO authenticated;

-- The landing dashboard needs counts, not every attendance record. Returning
-- grouped values avoids transferring notes, names, timestamps, and one JSON
-- object per student per school day on every login.
CREATE OR REPLACE FUNCTION public.attendance_period_summary(
  p_academic_year text,
  p_semester smallint,
  p_class_ids text[],
  p_recent_dates date[] DEFAULT ARRAY[]::date[]
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
WITH scoped AS (
  SELECT class_id, student_id, attendance_date, status, absence_type
  FROM public.attendance_entries
  WHERE academic_year = p_academic_year
    AND semester = p_semester
    AND class_id = ANY (COALESCE(p_class_ids, ARRAY[]::text[]))
), class_stats AS (
  SELECT
    class_id,
    count(*) AS total,
    count(*) FILTER (WHERE status IN ('present', 'tardy', 'early')) AS attended
  FROM scoped
  GROUP BY class_id
), student_stats AS (
  SELECT
    class_id,
    student_id,
    count(*) FILTER (WHERE status = 'present') AS present,
    count(*) FILTER (WHERE status = 'absent') AS absent,
    count(*) FILTER (WHERE status = 'absent' AND absence_type = 'excused') AS excused_absence,
    count(*) FILTER (WHERE status = 'absent' AND absence_type = 'unexcused') AS unexcused_absence,
    count(*) FILTER (WHERE status = 'tardy') AS tardy,
    count(*) FILTER (WHERE status = 'early') AS early
  FROM scoped
  GROUP BY class_id, student_id
), day_stats AS (
  SELECT
    attendance_date,
    count(*) FILTER (WHERE status = 'present') AS present,
    count(*) FILTER (WHERE status = 'absent' AND absence_type = 'excused') AS excused_absence,
    count(*) FILTER (WHERE status = 'absent' AND absence_type = 'unexcused') AS unexcused_absence,
    count(*) FILTER (WHERE status = 'tardy') AS tardy,
    count(*) FILTER (WHERE status = 'early') AS early
  FROM scoped
  WHERE attendance_date = ANY (COALESCE(p_recent_dates, ARRAY[]::date[]))
  GROUP BY attendance_date
), sync_state AS (
  SELECT revision, updated_at
  FROM public.attendance_sync_state
  WHERE singleton = true
)
SELECT jsonb_build_object(
  'revision', COALESCE((SELECT revision FROM sync_state), 0),
  'updatedAt', COALESCE((SELECT updated_at FROM sync_state), now()),
  'totalRecords', (SELECT count(*) FROM scoped),
  'classes', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'classId', class_id,
      'total', total,
      'attended', attended
    ) ORDER BY class_id)
    FROM class_stats
  ), '[]'::jsonb),
  'students', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'classId', class_id,
      'studentId', student_id,
      'present', present,
      'absent', absent,
      'excusedAbsence', excused_absence,
      'unexcusedAbsence', unexcused_absence,
      'tardy', tardy,
      'early', early
    ) ORDER BY class_id, student_id)
    FROM student_stats
  ), '[]'::jsonb),
  'days', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'date', attendance_date,
      'present', present,
      'excusedAbsence', excused_absence,
      'unexcusedAbsence', unexcused_absence,
      'tardy', tardy,
      'early', early
    ) ORDER BY attendance_date)
    FROM day_stats
  ), '[]'::jsonb)
)
$$;

REVOKE ALL ON FUNCTION public.attendance_period_summary(text, smallint, text[], date[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attendance_period_summary(text, smallint, text[], date[]) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
