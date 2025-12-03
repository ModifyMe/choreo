import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Note: We need SERVICE_ROLE_KEY to modify RLS policies usually, but if we are just running SQL via a postgres connection or if the anon key has admin rights (unlikely in prod but maybe in this dev setup).
// Actually, the previous script used `scripts/fix-activity-log-permissions.ts` but I don't have the content of that anymore to see how it connected.
// Wait, I can't run SQL DDL (GRANT, CREATE POLICY) via the JS client unless I use the `rpc` call to a function that runs SQL, or if I have direct DB access.
// The user's previous scripts likely used a direct postgres connection string or the user ran them manually?
// Let's check `scripts/inspect-db.ts` or similar if they exist.
// Ah, I see `scripts/fix-activity-log-permissions.ts` was deleted.
// Let's try to use the `postgres` library if available, or just standard supabase-js if there's a helper.
// Wait, the user has `prisma`. I can use `prisma.$executeRawUnsafe`.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPermissions() {
    console.log('Fixing permissions for User, Chore, and Reward tables...');

    const tables = ['User', 'Chore', 'Reward'];

    for (const table of tables) {
        try {
            console.log(`Processing ${table}...`);

            // 1. Grant SELECT permission
            await prisma.$executeRawUnsafe(`GRANT SELECT ON TABLE "${table}" TO anon, authenticated;`);
            console.log(` - Granted SELECT on ${table}`);

            // 2. Enable RLS
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
            console.log(` - Enabled RLS on ${table}`);

            // 3. Create Policy (idempotent-ish: drop if exists then create)
            // Note: Postgres doesn't have "CREATE POLICY IF NOT EXISTS" in older versions, but we can try dropping first.
            try {
                await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Allow read access" ON "${table}";`);
            } catch (e) {
                // Ignore if policy doesn't exist
            }

            await prisma.$executeRawUnsafe(`
                CREATE POLICY "Allow read access" ON "${table}"
                FOR SELECT
                TO anon, authenticated
                USING (true);
            `);
            console.log(` - Created read policy on ${table}`);

        } catch (error) {
            console.error(`Error processing ${table}:`, error);
        }
    }

    console.log('Finished fixing permissions.');
}

fixPermissions()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
