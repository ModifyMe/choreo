// Needs a disposable Postgres with the Prisma schema applied:
//   TEST_DATABASE_URL=postgres://... npx prisma db push --skip-generate
//   TEST_DATABASE_URL=postgres://... npm run test:steps
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const { PrismaClient } = require("@prisma/client");

const url = process.env.TEST_DATABASE_URL;
const { setChoreStep } = (() => {
    const exports = {};
    const code = ts.transpileModule(readFileSync(resolve(__dirname, "../src/lib/chore-steps.ts"), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { exports, require });
    return exports;
})();

const steps = ["a", "b", "c", "d"].map(id => ({ id, title: id, completed: false }));

test("concurrent ticks on different steps are all kept", { skip: !url && "TEST_DATABASE_URL not set" }, async () => {
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
        const household = await prisma.household.create({ data: { name: "steps test", inviteCode: `steps-${Date.now()}` } });
        const chore = await prisma.chore.create({ data: { householdId: household.id, title: "t", points: 10, steps } });
        await Promise.all(["a", "b", "c", "d"].map(id => setChoreStep(prisma, chore.id, id, true)));
        const saved = await prisma.chore.findUnique({ where: { id: chore.id } });
        assert.deepEqual(saved.steps.map(step => step.completed), [true, true, true, true]);

        // An explicit state is idempotent: repeating a tick does not untick it.
        await setChoreStep(prisma, chore.id, "a", true);
        await setChoreStep(prisma, chore.id, "b", false);
        const again = await prisma.chore.findUnique({ where: { id: chore.id } });
        assert.deepEqual(again.steps.map(step => step.completed), [true, false, true, true]);
        await prisma.chore.delete({ where: { id: chore.id } });
        await prisma.household.delete({ where: { id: household.id } });
    } finally {
        await prisma.$disconnect();
    }
});
