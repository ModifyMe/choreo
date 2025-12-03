-- Grant access to the table for the anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "ActivityLog" TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows read access for all users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policy pol
        JOIN pg_class rel ON pol.polrelid = rel.oid
        WHERE pol.polname = 'Enable read access for all users'
        AND rel.relname = 'ActivityLog'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON "ActivityLog"
            FOR SELECT
            USING (true);
    END IF;
END
$$;