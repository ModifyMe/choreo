const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, dependencies = {}, globals = {}) {
    const exports = {};
    const code = ts.transpileModule(readFileSync(resolve(__dirname, "..", file), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, { exports, ...globals, require(name) {
        if (name in dependencies) return dependencies[name];
        throw new Error(`Unexpected import: ${name}`);
    } });
    return exports;
}

const { reconcileChoreUpdates, retireEchoedUpdates } = load("src/lib/chore-actions.ts");
const chore = { id: "task", householdId: "home", status: "PENDING", assignedToId: null, points: 50 };

function fixture({ status = 200, networkError = false, assignedToId = null } = {}) {
    let finishRequest;
    const request = new Promise(resolve => { finishRequest = resolve; });
    const events = [];
    const updates = new Map();
    const previous = { ...chore, assignedToId };
    let requestBody;
    const service = load("src/lib/chore-actions.ts", {}, { fetch: async (url, options) => {
        requestBody = JSON.parse(options.body);
        assert.equal(options.headers["Content-Type"], "application/json");
        events.push("request");
        await request;
        events.push("response");
        if (networkError) throw new Error("Offline");
        return new Response(status === 200 ? "{}" : "Already claimed", { status });
    } });
    const { useChoreAction } = load("src/app/dashboard/use-chore-action.ts", {
        react: { useCallback: fn => fn },
        "next/navigation": { useRouter: () => ({ refresh: () => events.push("refresh") }) },
        "@/lib/chore-actions": service,
        "./chore-context": { useChores: () => ({
            myChores: assignedToId ? [previous] : [], availableChores: assignedToId ? [] : [previous], householdChores: [],
            updateChore(id, patch) { events.push("optimistic"); updates.set(id, { ...updates.get(id), ...patch }); },
            clearChoreUpdate(id) { events.push("rollback"); updates.delete(id); },
        }) },
    });
    return { perform: useChoreAction("person"), finishRequest, events, updates, requestBody: () => requestBody };
}

for (const action of ["CLAIM", "COMPLETE"]) {
    test(`${action} updates its list immediately and refreshes server stats after saving without realtime`, async () => {
        const f = fixture();
        const pending = f.perform("task", action, "https://example.test/proof.jpg");
        assert.equal(f.events.includes("refresh"), false);
        assert.equal(f.updates.get("task")[action === "CLAIM" ? "assignedToId" : "status"], action === "CLAIM" ? "person" : "COMPLETED");
        f.finishRequest();
        await pending;
        assert.deepEqual(f.events, ["optimistic", "request", "response", "refresh"]);
        assert.equal(f.requestBody().action, action);
        assert.equal(f.requestBody().proofImage, "https://example.test/proof.jpg");
    });
}

for (const options of [{ status: 409 }, { networkError: true }]) {
    test(`a ${options.networkError ? "network" : "server"} failure restores assignment/status and refreshes authoritative data`, async () => {
        const f = fixture(options);
        const pending = f.perform("task", "CLAIM");
        f.finishRequest();
        await assert.rejects(pending, /Offline|Already claimed/);
        assert.equal(f.updates.has("task"), false, "failed claims must not mask someone else's server assignment");
        assert.equal(f.events.includes("rollback"), true);
        assert.equal(f.events.at(-1), "refresh");
    });
}

test("failed completion restores a chore to its original assignee", async () => {
    const f = fixture({ status: 400, assignedToId: "person" });
    const pending = f.perform("task", "COMPLETE");
    f.finishRequest();
    await assert.rejects(pending);
    assert.equal(f.updates.has("task"), false);
    assert.equal(f.events.includes("rollback"), true);
});

test("a confirmed claim retires its overlay so future reassignment is visible", () => {
    const updates = new Map([["task", { assignedToId: "person" }]]);
    const remaining = reconcileChoreUpdates(updates, [{ ...chore, assignedToId: "person" }]);
    assert.equal(remaining.size, 0);
    assert.equal(updates.size, 1, "must not mutate React's previous state");
});

test("a completed chore missing from pending server data retires its overlay so undo works", () => {
    const updates = new Map([["task", { status: "COMPLETED" }]]);
    assert.equal(reconcileChoreUpdates(updates, []).size, 0);
});

test("an older snapshot keeps a newer in-flight claim", () => {
    const updates = new Map([["task", { assignedToId: "person" }]]);
    assert.equal(reconcileChoreUpdates(updates, [chore]).size, 1);
});

const tick = (...done) => ["a", "b", "c"].map(id => ({ completed: done.includes(id), title: id, id }));

test("an echo of an earlier step save keeps ticks still on their way", () => {
    const updates = new Map([["task", { steps: tick("a", "b", "c") }]]);
    const remaining = retireEchoedUpdates(updates, [{ ...chore, steps: tick("a") }]);
    assert.equal(remaining.size, 1);
    assert.equal(updates.size, 1, "must not mutate React's previous state");
});

test("the echo that carries every tick retires the overlay, whatever its key order", () => {
    const updates = new Map([["task", { steps: tick("a", "b", "c").map(({ id, title, completed }) => ({ id, title, completed })) }]]);
    assert.equal(retireEchoedUpdates(updates, [{ ...chore, steps: tick("a", "b", "c") }]).size, 0);
});

test("echoes still clear overlays without subtasks, and leave other chores alone", () => {
    const updates = new Map([["task", { assignedToId: "person" }], ["other", { status: "COMPLETED" }]]);
    const remaining = retireEchoedUpdates(updates, [chore]);
    assert.deepEqual([...remaining.keys()], ["other"]);
});
