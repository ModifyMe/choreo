const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(readFileSync(resolve(__dirname,
    "../src/app/api/households/[id]/reset/route.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

const levels = {};
vm.runInNewContext(ts.transpileModule(readFileSync(resolve(__dirname, "../src/lib/levels.ts"), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: levels });

function fixture({ role = "ADMIN", signedIn = true, failOn } = {}) {
    let state = {
        membership: [
            { userId: "admin", householdId: "a", role, balance: 12, totalPoints: 50, currentStreak: 3, lastChoreDate: "2026-10-19" },
            { userId: "member", householdId: "a", role: "MEMBER", balance: 8, totalPoints: 20, currentStreak: 1, lastChoreDate: "2026-10-18" },
            { userId: "admin", householdId: "b", role: "ADMIN", balance: 99, totalPoints: 100, currentStreak: 5 },
        ],
        ...Object.fromEntries(["swapOffer", "activityLog", "chore", "reward", "shoppingItem"].map((model) =>
            [model, [{ id: `${model}-a`, householdId: "a" }, { id: `${model}-b`, householdId: "b" }]])),
    };
    let transactionCount = 0;
    const prisma = {
        async $transaction(callback, options) {
            transactionCount++;
            assert.equal(options.isolationLevel, "Serializable");
            const draft = structuredClone(state);
            const tx = Object.fromEntries(Object.keys(draft).map((model) => [model, {
                async deleteMany({ where }) {
                    if (failOn === model) throw new Error("Database unavailable");
                    draft[model] = draft[model].filter((row) => row.householdId !== where.householdId);
                },
            }]));
            tx.membership.findUnique = async ({ where: { userId_householdId: key } }) =>
                draft.membership.find((row) => row.userId === key.userId && row.householdId === key.householdId) ?? null;
            tx.membership.updateMany = async ({ where, data }) => {
                for (const row of draft.membership) if (row.householdId === where.householdId) Object.assign(row, data);
            };
            const result = await callback(tx);
            state = draft;
            return result;
        },
    };
    const exports = {};
    vm.runInNewContext(source, {
        exports, Request, URL, console: { error() {} },
        require(name) {
            if (name === "next-auth") return { getServerSession: async () => signedIn ? { user: { id: "admin" } } : null };
            if (name === "@/lib/auth") return { authOptions: {} };
            if (name === "@/lib/prisma") return { prisma };
            if (name === "@prisma/client") return { Prisma: {
                TransactionIsolationLevel: { Serializable: "Serializable" },
                PrismaClientKnownRequestError: class extends Error {},
            } };
            if (name === "next/server") return { NextResponse: class extends Response {
                static json(value) { return Response.json(value); }
            } };
            throw new Error(`Unexpected import ${name}`);
        },
    });
    return {
        state: () => state,
        transactionCount: () => transactionCount,
        reset(householdId = "a", body = { confirmation: "RESET" }, origin = "https://www.choreo.top") {
            return exports.POST(new Request(`https://www.choreo.top/api/households/${householdId}/reset`, {
                method: "POST", headers: { "content-type": "application/json", origin },
                body: typeof body === "string" ? body : JSON.stringify(body),
            }), { params: Promise.resolve({ id: householdId }) });
        },
    };
}

test("admin resets only the selected household and keeps its members and roles", async () => {
    const f = fixture();
    const original = structuredClone(f.state());
    assert.equal((await f.reset()).status, 200);
    for (const model of ["swapOffer", "activityLog", "chore", "reward", "shoppingItem"]) {
        assert.deepEqual(f.state()[model], original[model].filter((row) => row.householdId === "b"));
    }
    assert.equal(f.state().membership.length, 3);
    for (const row of f.state().membership.filter((row) => row.householdId === "a")) {
        assert.equal(row.balance, 0);
        assert.equal(row.totalPoints, 0);
        assert.equal(levels.getLevel(row.totalPoints).level, 1);
        assert.equal(row.currentStreak, 0);
        assert.equal(row.lastChoreDate, null);
        assert.equal(row.role, original.membership.find((old) => old.userId === row.userId && old.householdId === "a").role);
    }
    assert.deepEqual(f.state().membership[2], original.membership[2]);
});

for (const [label, options, householdId, expected] of [
    ["signed-out user", { signedIn: false }, "a", 401],
    ["non-admin member", { role: "MEMBER" }, "a", 403],
    ["nonmember", {}, "other-household", 403],
]) {
    test(`${label} cannot reset a household`, async () => {
        const f = fixture(options);
        const original = structuredClone(f.state());
        assert.equal((await f.reset(householdId)).status, expected);
        assert.deepEqual(f.state(), original);
    });
}

test("requires exact confirmation and rejects malformed requests before touching the database", async () => {
    const f = fixture();
    for (const body of [{}, { confirmation: "reset" }, "not json"]) {
        assert.equal((await f.reset("a", body)).status, 400);
    }
    assert.equal(f.transactionCount(), 0);
});

test("rejects cross-origin reset requests", async () => {
    const f = fixture();
    assert.equal((await f.reset("a", { confirmation: "RESET" }, "https://other.example")).status, 403);
    assert.equal(f.transactionCount(), 0);
});

test("a database error rolls back earlier deletes and preserves member balances", async () => {
    const f = fixture({ failOn: "reward" });
    const original = structuredClone(f.state());
    assert.equal((await f.reset()).status, 500);
    assert.deepEqual(f.state(), original);
});
