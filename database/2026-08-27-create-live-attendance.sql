BEGIN;

-- Attendance is stored independently from school_state so an older browser
-- cannot erase current records by replacing the shared JSON document.
CREATE TABLE IF NOT EXISTS public.attendance_entries (
  academic_year text NOT NULL CHECK (academic_year ~ '^\d{4}-\d{4}$'),
  semester smallint NOT NULL CHECK (semester IN (1, 2)),
  class_id text NOT NULL,
  student_id text NOT NULL,
  attendance_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'tardy', 'early')),
  absence_type text,
  note text NOT NULL DEFAULT '',
  updated_by text,
  updated_by_email text,
  updated_by_name text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (academic_year, semester, class_id, student_id, attendance_date),
  CONSTRAINT attendance_entries_absence_type_check CHECK (
    (status = 'absent' AND absence_type IN ('excused', 'unexcused'))
    OR (status <> 'absent' AND absence_type IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS attendance_entries_period_date_idx
  ON public.attendance_entries (academic_year, semester, attendance_date, class_id);
CREATE INDEX IF NOT EXISTS attendance_entries_updated_idx
  ON public.attendance_entries (academic_year, semester, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_entries TO authenticated;

ALTER TABLE public.attendance_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS attendance_entries_read ON public.attendance_entries;
CREATE POLICY attendance_entries_read ON public.attendance_entries
  FOR SELECT TO authenticated
  USING (app_private.current_app_role() IS NOT NULL);

DROP POLICY IF EXISTS attendance_entries_write ON public.attendance_entries;
CREATE POLICY attendance_entries_write ON public.attendance_entries
  FOR ALL TO authenticated
  USING (app_private.current_app_role() IN ('admin','principal','teacher','supervisor'))
  WITH CHECK (app_private.current_app_role() IN ('admin','principal','teacher','supervisor'));

-- Preserve every attendance record that is still present in the legacy JSON.
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
      WHEN record ->> 'status' IN ('present','absent','tardy','early') THEN record ->> 'status'
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

-- Ask the Neon Data API to discover the new table immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
