BEGIN;

ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS absence_type text;

UPDATE attendance_records
SET absence_type = 'excused'
WHERE status = 'absent'
  AND absence_type IS NULL;

UPDATE attendance_records
SET absence_type = NULL
WHERE status <> 'absent'
  AND absence_type IS NOT NULL;

ALTER TABLE attendance_records
  DROP CONSTRAINT IF EXISTS attendance_absence_type_consistency;

ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_absence_type_consistency CHECK (
    (status = 'absent' AND absence_type IS NOT NULL AND absence_type IN ('excused', 'unexcused'))
    OR (status <> 'absent' AND absence_type IS NULL)
  );

COMMIT;
