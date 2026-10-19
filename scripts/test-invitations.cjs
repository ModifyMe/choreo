const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

function load(file, dependencies) {
    const exports = {};
    const source = ts.transpileModule(readFileSync(resolve(__dirname, "..", file), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(source, { exports, URLSearchParams, console, require(name) {
        if (name in dependencies) return dependencies[name];
        if (name === "react" || name === "react/jsx-runtime") return require(name);
        throw new Error(`Unexpected import: ${name}`);
    } });
    return exports;
}

function fixture({ signedIn = true, exists = true, existingRole } = {}) {
    const household = { id: "invited-household", name: "Our home", inviteCode: "A_B-12" };
    let membership = existingRole ? { userId: "person", householdId: household.id, role: existingRole } : null;
    let queries = 0;
    const dependencies = {
        "@/lib/auth": { authOptions: {} },
        "next-auth": { getServerSession: async () => signedIn ? { user: { id: "person", email: "person@example.test" } } : null },
        "@/lib/prisma": { prisma: {
            household: { findUnique: async ({ where }) => { queries++; return exists && where.inviteCode === household.inviteCode ? household : null; } },
            membership: { upsert: async ({ where, create, update }) => {
                assert.equal(where.userId_householdId.householdId, household.id);
                assert.equal(where.userId_householdId.userId, "person");
                membership = membership ? { ...membership, ...update } : create;
                return membership;
            } },
        } },
        "next/server": { NextResponse: class extends Response { static json(value) { return Response.json(value); } } },
    };
    const { POST } = load("src/app/api/households/join/route.ts", dependencies);
    return { dependencies, household, membership: () => membership, queries: () => queries,
        join: (inviteCode = " a_b-12 ") => POST(new Request("https://www.choreo.top/api/households/join", {
            method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ inviteCode }),
        })),
    };
}

test("invite code from a link joins its household and accepts lowercase/whitespace", async () => {
    const f = fixture();
    const response = await f.join();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).id, f.household.id);
    assert.equal(f.membership().role, "MEMBER");
});

test("reopening or retrying an invitation preserves an existing admin role", async () => {
    const f = fixture({ existingRole: "ADMIN" });
    assert.equal((await f.join()).status, 200);
    assert.equal((await f.join()).status, 200);
    assert.equal(f.membership().role, "ADMIN");
});

test("signed-out users cannot join, and invalid or expired codes create no membership", async () => {
    assert.equal((await fixture({ signedIn: false }).join()).status, 401);
    const f = fixture();
    for (const code of [null, 123456, "", "TOOLONG", "bad<&>"]) assert.equal((await f.join(code)).status, 400);
    assert.equal(f.queries(), 0);
    const expired = fixture({ exists: false });
    assert.equal((await expired.join()).status, 404);
    assert.equal(expired.membership(), null);
});

test("signed-out invite retains its code in the OAuth return URL", async () => {
    const f = fixture({ signedIn: false });
    const { default: Page } = load("src/app/onboarding/page.tsx", {
        ...f.dependencies, "./onboarding-client": { OnboardingClient: () => null }, "./auto-sign-in": { AutoSignIn: () => null },
    });
    const element = await Page({ searchParams: Promise.resolve({ code: "a_b-12" }) });
    assert.equal(element.props.callbackUrl, "/onboarding?code=A_B-12");
    assert.equal(f.queries(), 0);
});

test("after Google sign-in the invitation includes the household name and original code", async () => {
    const f = fixture();
    const { default: Page } = load("src/app/onboarding/page.tsx", {
        ...f.dependencies, "./onboarding-client": { OnboardingClient: () => null }, "./auto-sign-in": { AutoSignIn: () => null },
    });
    const element = await Page({ searchParams: Promise.resolve({ code: "a_b-12" }) });
    assert.equal(element.props.code, "A_B-12");
    assert.equal(element.props.inviteHouseholdName, "Our home");
});

test("valid invitation opens Join mode with no code-entry input", () => {
    const componentNames = { Button: "button", Card: "section", CardContent: "div", CardDescription: "p", CardHeader: "header", CardTitle: "h1", Input: "input", Label: "label" };
    const ui = Object.fromEntries(Object.entries(componentNames).map(([key, tag]) => [key, ({ children, asChild, ...props }) => React.createElement(tag, props, children)]));
    const { OnboardingClient } = load("src/app/onboarding/onboarding-client.tsx", {
        "next/navigation": { useRouter: () => ({}) },
        ...Object.fromEntries(["button", "card", "input", "label"].map(name => [`@/components/ui/${name}`, ui])),
        "lucide-react": { Home: () => null, UserPlus: () => null, Loader2: () => null },
    });
    const html = renderToStaticMarkup(React.createElement(OnboardingClient, { code: "A_B-12", inviteHouseholdName: "Our home" }));
    assert.match(html, /Join Our home/);
    assert.match(html, /Your link already includes the invite code/);
    assert.doesNotMatch(html, /<input/);
    assert.doesNotMatch(html, /type="submit"[^>]*disabled/);
    const manual = renderToStaticMarkup(React.createElement(OnboardingClient, { code: "A_B-12" }));
    assert.match(manual, /value="A_B-12"/);
});
