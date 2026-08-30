-- Allow supervisors to edit existing student information and manage notifications.
-- Student creation and deletion remain restricted to administrators and principals.

DROP POLICY IF EXISTS students_supervisor_update ON public.students;
CREATE POLICY students_supervisor_update ON public.students
  FOR UPDATE TO authenticated
  USING (app_private.current_app_role() = 'supervisor')
  WITH CHECK (app_private.current_app_role() = 'supervisor');

DROP POLICY IF EXISTS notifications_write ON public.notifications;
CREATE POLICY notifications_write ON public.notifications
  FOR ALL TO authenticated
  USING (app_private.current_app_role() IN ('admin','principal','teacher','supervisor'))
  WITH CHECK (app_private.current_app_role() IN ('admin','principal','teacher','supervisor'));

-- Existing accounts may carry explicit false notification access from older settings.
-- Upgrade them once; administrators can still change individual section access afterward.
UPDATE public.staff_profiles
SET section_permissions = jsonb_set(
  COALESCE(section_permissions, '{}'::jsonb),
  '{notifications}', 'true'::jsonb, true
);

UPDATE public.staff_invites
SET section_permissions = jsonb_set(
  COALESCE(section_permissions, '{}'::jsonb),
  '{notifications}', 'true'::jsonb, true
);

UPDATE public.staff_profiles
SET section_permissions = jsonb_set(
  COALESCE(section_permissions, '{}'::jsonb),
  '{students_edit}', 'true'::jsonb, true
)
WHERE role = 'supervisor';

UPDATE public.staff_invites
SET section_permissions = jsonb_set(
  COALESCE(section_permissions, '{}'::jsonb),
  '{students_edit}', 'true'::jsonb, true
)
WHERE role = 'supervisor';
