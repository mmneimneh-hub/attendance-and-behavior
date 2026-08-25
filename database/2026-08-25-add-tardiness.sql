-- Add tardiness as a valid daily attendance status.

ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_status_check;

ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_status_check
    CHECK (status IN ('present','absent','tardy','early'));
