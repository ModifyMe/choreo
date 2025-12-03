
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking RLS Policies on ActivityLog Table...');
        const policies = await prisma.$queryRaw`
      SELECT * FROM pg_policies WHERE tablename = 'ActivityLog';
    `;
        console.log(policies);

        console.log('\nChecking ActivityLog Table Permissions...');
        const permissions = await prisma.$queryRaw`
      SELECT grantee, privilege_type 
      FROM information_schema.role_table_grants 
      WHERE table_name = 'ActivityLog';
    `;
        console.log(permissions);

    } catch (error) {
        console.error('Error inspecting DB:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
