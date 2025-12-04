-- Enable RLS on system tables
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- Create policies to deny access to anon and authenticated roles by default
-- This effectively makes these tables private to the API, but accessible by the service_role (and Prisma)

-- Account
CREATE POLICY "Deny public access to Account" ON "Account"
  FOR ALL
  TO public
  USING (false);

-- Session
CREATE POLICY "Deny public access to Session" ON "Session"
  FOR ALL
  TO public
  USING (false);

-- VerificationToken
CREATE POLICY "Deny public access to VerificationToken" ON "VerificationToken"
  FOR ALL
  TO public
  USING (false);