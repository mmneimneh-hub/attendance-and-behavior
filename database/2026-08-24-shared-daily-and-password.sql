-- Align the live database with the shared, daily-attendance application model.

DROP POLICY IF EXISTS staff_read ON public.staff_profiles;
CREATE POLICY staff_read ON public.staff_profiles
  FOR SELECT TO authenticated
  USING (app_private.current_app_role() IS NOT NULL);

ALTER TABLE public.attendance_records
  DROP CONSTRAINT IF EXISTS attendance_records_semester_id_student_id_attendance_date_p_key,
  DROP CONSTRAINT IF EXISTS attendance_records_period_check,
  DROP CONSTRAINT IF EXISTS attendance_records_status_check,
  DROP COLUMN IF EXISTS period;

ALTER TABLE public.attendance_records
  ADD CONSTRAINT attendance_records_status_check
    CHECK (status IN ('present','absent','early')),
  ADD CONSTRAINT attendance_records_daily_unique
    UNIQUE (semester_id, student_id, attendance_date);

CREATE OR REPLACE FUNCTION public.set_own_password_hash(p_password_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, neon_auth, pg_temp
AS $$
DECLARE
  caller_id text := auth.user_id();
BEGIN
  IF caller_id IS NULL OR app_private.current_app_role() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_password_hash !~ '^[0-9a-f]{32}:[0-9a-f]{128}$' THEN
    RAISE EXCEPTION 'Invalid password hash';
  END IF;

  UPDATE neon_auth.account
  SET password = p_password_hash,
      "updatedAt" = now()
  WHERE "userId"::text = caller_id
    AND "providerId" = 'credential';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credential account not found';
  END IF;
END
$$;

REVOKE ALL ON FUNCTION public.set_own_password_hash(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_own_password_hash(text) TO authenticated;
