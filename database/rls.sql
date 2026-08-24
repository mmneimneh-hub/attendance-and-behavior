-- Run after Managed Better Auth and the Neon Data API are provisioned.
CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.current_app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role
  FROM public.staff_profiles
  WHERE user_id = auth.user_id() AND active = true
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION app_private.current_app_role() FROM PUBLIC;
GRANT USAGE ON SCHEMA app_private TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.current_app_role() TO authenticated;

CREATE OR REPLACE FUNCTION app_private.accept_staff_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  invited public.staff_invites%ROWTYPE;
BEGIN
  SELECT * INTO invited
  FROM public.staff_invites
  WHERE lower(email) = lower(NEW.email) AND active = true;

  IF FOUND THEN
    INSERT INTO public.staff_profiles (user_id, email, full_name, role, programs, grade_levels, section_permissions, active)
    VALUES (NEW.id::text, lower(NEW.email), invited.full_name, invited.role, invited.programs, invited.grade_levels, invited.section_permissions, true)
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      programs = EXCLUDED.programs,
      grade_levels = EXCLUDED.grade_levels,
      section_permissions = EXCLUDED.section_permissions,
      active = true,
      updated_at = now();
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS attendance_accept_staff_invite ON neon_auth."user";
CREATE TRIGGER attendance_accept_staff_invite
AFTER INSERT OR UPDATE OF email ON neon_auth."user"
FOR EACH ROW EXECUTE FUNCTION app_private.accept_staff_invite();

CREATE OR REPLACE FUNCTION app_private.activate_existing_invited_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  auth_user neon_auth."user"%ROWTYPE;
BEGIN
  SELECT * INTO auth_user
  FROM neon_auth."user"
  WHERE lower(email) = lower(NEW.email)
  LIMIT 1;

  IF FOUND AND NEW.active = true THEN
    INSERT INTO public.staff_profiles (user_id, email, full_name, role, programs, grade_levels, section_permissions, active)
    VALUES (auth_user.id::text, lower(auth_user.email), NEW.full_name, NEW.role, NEW.programs, NEW.grade_levels, NEW.section_permissions, true)
    ON CONFLICT (user_id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      programs = EXCLUDED.programs,
      grade_levels = EXCLUDED.grade_levels,
      section_permissions = EXCLUDED.section_permissions,
      active = true,
      updated_at = now();
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS attendance_activate_existing_invited_user ON public.staff_invites;
CREATE TRIGGER attendance_activate_existing_invited_user
AFTER INSERT OR UPDATE OF email, full_name, role, active ON public.staff_invites
FOR EACH ROW EXECUTE FUNCTION app_private.activate_existing_invited_user();

CREATE OR REPLACE FUNCTION public.save_attendance_state(
  p_academic_year text,
  p_semester text,
  p_attendance jsonb,
  p_notifications jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF app_private.current_app_role() NOT IN ('admin','principal','teacher','supervisor') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_semester NOT IN ('1','2') THEN
    RAISE EXCEPTION 'Semester must be 1 or 2';
  END IF;

  UPDATE public.school_state
  SET data = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(data,
              ARRAY['academicYears', p_academic_year, 'semesters', p_semester, 'attendance'],
              coalesce(p_attendance, '{}'::jsonb), true),
            ARRAY['academicYears', p_academic_year, 'semesters', p_semester, 'notifications'],
            coalesce(p_notifications, '[]'::jsonb), true),
          ARRAY['attendance'], coalesce(p_attendance, '{}'::jsonb), true),
        ARRAY['notifications'], coalesce(p_notifications, '[]'::jsonb), true),
      updated_at = now(),
      updated_by = auth.user_id()
  WHERE singleton = true;
END
$$;

REVOKE ALL ON FUNCTION public.save_attendance_state(text, text, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_attendance_state(text, text, jsonb, jsonb) TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS academic_years_read ON academic_years;
CREATE POLICY academic_years_read ON academic_years
  FOR SELECT TO authenticated USING (app_private.current_app_role() IS NOT NULL);
DROP POLICY IF EXISTS academic_years_manage ON academic_years;
CREATE POLICY academic_years_manage ON academic_years
  FOR ALL TO authenticated
  USING (app_private.current_app_role() IN ('admin','principal'))
  WITH CHECK (app_private.current_app_role() IN ('admin','principal'));

DROP POLICY IF EXISTS semesters_read ON semesters;
CREATE POLICY semesters_read ON semesters
  FOR SELECT TO authenticated USING (app_private.current_app_role() IS NOT NULL);
DROP POLICY IF EXISTS semesters_manage ON semesters;
CREATE POLICY semesters_manage ON semesters
  FOR ALL TO authenticated
  USING (app_private.current_app_role() IN ('admin','principal'))
  WITH CHECK (app_private.current_app_role() IN ('admin','principal'));

DROP POLICY IF EXISTS staff_read ON staff_profiles;
CREATE POLICY staff_read ON staff_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.user_id() OR app_private.current_app_role() = 'admin');
DROP POLICY IF EXISTS staff_manage ON staff_profiles;
CREATE POLICY staff_manage ON staff_profiles
  FOR ALL TO authenticated
  USING (app_private.current_app_role() = 'admin')
  WITH CHECK (app_private.current_app_role() = 'admin');

DROP POLICY IF EXISTS classes_read ON classes;
CREATE POLICY classes_read ON classes
  FOR SELECT TO authenticated USING (app_private.current_app_role() IS NOT NULL);
DROP POLICY IF EXISTS classes_manage ON classes;
CREATE POLICY classes_manage ON classes
  FOR ALL TO authenticated
  USING (app_private.current_app_role() IN ('admin','principal'))
  WITH CHECK (app_private.current_app_role() IN ('admin','principal'));

DROP POLICY IF EXISTS students_read ON students;
CREATE POLICY students_read ON students
  FOR SELECT TO authenticated USING (app_private.current_app_role() IS NOT NULL);
DROP POLICY IF EXISTS students_manage ON students;
CREATE POLICY students_manage ON students
  FOR ALL TO authenticated
  USING (app_private.current_app_role() IN ('admin','principal'))
  WITH CHECK (app_private.current_app_role() IN ('admin','principal'));

DROP POLICY IF EXISTS attendance_read ON attendance_records;
CREATE POLICY attendance_read ON attendance_records
  FOR SELECT TO authenticated USING (app_private.current_app_role() IS NOT NULL);
DROP POLICY IF EXISTS attendance_write ON attendance_records;
CREATE POLICY attendance_write ON attendance_records
  FOR ALL TO authenticated
  USING (app_private.current_app_role() IN ('admin','principal','teacher','supervisor'))
  WITH CHECK (app_private.current_app_role() IN ('admin','principal','teacher','supervisor'));

DROP POLICY IF EXISTS notifications_read ON notifications;
CREATE POLICY notifications_read ON notifications
  FOR SELECT TO authenticated USING (app_private.current_app_role() IS NOT NULL);
DROP POLICY IF EXISTS notifications_write ON notifications;
CREATE POLICY notifications_write ON notifications
  FOR ALL TO authenticated
  USING (app_private.current_app_role() IN ('admin','principal','teacher'))
  WITH CHECK (app_private.current_app_role() IN ('admin','principal','teacher'));

DROP POLICY IF EXISTS settings_read ON school_settings;
CREATE POLICY settings_read ON school_settings
  FOR SELECT TO authenticated USING (app_private.current_app_role() IS NOT NULL);
DROP POLICY IF EXISTS settings_manage ON school_settings;
CREATE POLICY settings_manage ON school_settings
  FOR ALL TO authenticated
  USING (app_private.current_app_role() = 'admin')
  WITH CHECK (app_private.current_app_role() = 'admin');

DROP POLICY IF EXISTS invites_read ON staff_invites;
CREATE POLICY invites_read ON staff_invites
  FOR SELECT TO authenticated
  USING (app_private.current_app_role() = 'admin');
DROP POLICY IF EXISTS invites_manage ON staff_invites;
CREATE POLICY invites_manage ON staff_invites
  FOR ALL TO authenticated
  USING (app_private.current_app_role() = 'admin')
  WITH CHECK (app_private.current_app_role() = 'admin');

DROP POLICY IF EXISTS school_state_read ON school_state;
CREATE POLICY school_state_read ON school_state
  FOR SELECT TO authenticated
  USING (app_private.current_app_role() IS NOT NULL);
DROP POLICY IF EXISTS school_state_manage ON school_state;
CREATE POLICY school_state_manage ON school_state
  FOR ALL TO authenticated
  USING (app_private.current_app_role() IN ('admin','principal','teacher','supervisor'))
  WITH CHECK (app_private.current_app_role() IN ('admin','principal','teacher','supervisor'));
