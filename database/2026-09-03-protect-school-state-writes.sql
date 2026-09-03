BEGIN;

-- The operation function locks and updates the singleton row. Run it with its
-- database-owner privileges so authenticated clients do not need direct table
-- mutation rights.
ALTER FUNCTION public.apply_school_state_operations(jsonb, text) SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.apply_school_state_operations(jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_school_state_operations(jsonb, text) TO authenticated;

-- Prevent every browser build, including stale cached builds, from replacing
-- the shared JSON document directly. All writes must use granular operations.
DROP POLICY IF EXISTS school_state_manage ON public.school_state;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.school_state FROM authenticated;
GRANT SELECT ON public.school_state TO authenticated;

COMMIT;
