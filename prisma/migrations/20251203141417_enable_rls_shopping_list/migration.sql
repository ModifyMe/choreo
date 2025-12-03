-- Grant access to the table for the anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON "ShoppingItem" TO anon, authenticated, service_role;

-- Enable RLS
ALTER TABLE "ShoppingItem" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows read access for all users (needed for Realtime subscription by anon/authenticated)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polname = 'Enable read access for all users'
    ) THEN
        CREATE POLICY "Enable read access for all users" ON "ShoppingItem"
            FOR SELECT
            USING (true);
    END IF;
END
$$;