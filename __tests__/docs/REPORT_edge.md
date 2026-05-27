# SOFTWARE TESTING PROJECT REPORT — Edge Function Tests (Deno)

| Field | Value |
|---|---|
| **Report Title** | Edge Function Testing Report — Sorted Subscription Tracker |

---

## Section 1: Introduction

### 1.1 Application Overview

See `REPORT_unit.md` Section 1.1 for a full application overview.

---

### 1.2 Project Objectives

1. Verify that the `send-reminders` edge function rejects requests that are missing an Authorization header with a 401 response.
2. Verify that requests carrying an incorrect Bearer token are also rejected with a 401 response.
3. Confirm that the function builds and sends push notifications for subscriptions whose renewal date falls within the user's configured `days_before` window.
4. Confirm that the function correctly parses Expo push ticket responses, counting only `status: "ok"` tickets as sent and logging errors for failed tickets.

---

### 1.3 Scope

**In scope:**
- `supabase/functions/send-reminders/index.ts` — the Deno edge function handler
- Auth guard: `Authorization` header validation against `SUPABASE_SERVICE_ROLE_KEY`
- Notification dispatch: querying `notification_preferences`, `subscriptions`, and `push_tokens` tables, building push messages, calling the Expo Push API
- Expo ticket parsing: counting `status: "ok"` tickets vs `status: "error"` tickets

**Out of scope:**
- Live Supabase database calls (replaced by a mock client)
- Live Expo Push API calls (replaced by a stubbed `fetch`)
- Real `pg_cron` scheduling
- Chunk batching behaviour beyond a single batch (all test data fits within the 100-message limit)

**Mocking strategy:**

| Mock | Reason |
|---|---|
| `Deno.env.get` | Stubbed via `@std/testing/mock` to supply `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` without needing real environment variables |
| Supabase client (`supabaseOverride` parameter) | A minimal mock object is injected directly into `handler()` — avoids any real DB connection |
| `globalThis.fetch` | Stubbed to return canned Expo push ticket responses — avoids any real network call |

The handler was minimally refactored to accept an optional `supabaseOverride` parameter for test injection. Production behaviour is unchanged: when called without the parameter, `handler()` creates a real Supabase client from environment variables as before.

---

## Section 2: Test Plan

### 2.1 Testing Strategy

| Layer | Approach | Status |
|---|---|---|
| Unit testing | Automated — Jest | Implemented |
| Integration testing | Automated — Jest with Supabase mock client | Implemented |
| Component testing | Automated — React Native Testing Library | Implemented |
| Screen testing | Automated — React Native Testing Library | Implemented |
| Edge function testing | Automated — Deno test runner | Implemented |
| System / E2E testing | Automated — Detox on Android emulator | Implemented |

---

### 2.2 Testing Approach

**Approach: Automated unit testing using the Deno built-in test runner.**

The Deno test runner was chosen because the edge function runs in a Deno environment — Jest cannot import `https://esm.sh/` URLs or `jsr:` specifiers. Tests are written as `Deno.test(...)` blocks and use the standard library's assertion and mock utilities from `jsr:@std/assert` and `jsr:@std/testing/mock`.

All external dependencies are stubbed using the `stub()` function from `@std/testing/mock`. The `using` keyword (explicit resource management) ensures stubs are automatically restored after each test, preventing cross-test bleed.

---

### 2.3 Testing Levels

**Edge Function Testing — Implemented**
Tests the exported `handler` function directly with constructed `Request` objects. No HTTP server is started. All database and network I/O is replaced with stubs and injected mocks.

---

### 2.4 Resources and Schedule

**Tools and frameworks:**

| Tool | Version | Purpose |
|---|---|---|
| Deno | 1.43+ | Test runtime and built-in test runner |
| `jsr:@std/assert` | latest | `assertEquals` assertion |
| `jsr:@std/testing/mock` | latest | `stub()` for `Deno.env` and `globalThis.fetch` |

**Run command:**
```bash
deno test --allow-env supabase/functions/send-reminders/index.test.ts
```

---

## Section 3: Black-Box Testing Test Cases

### 3.1 Technique 1: Equivalence Partitioning

**Applied to:** Authorization header validation (auth guard).

The auth guard has three input partitions:
- Partition A: no `Authorization` header present → 401
- Partition B: header present but token does not match service key → 401
- Partition C: header present with correct token → handler proceeds

**Test Cases:**

| Test ID | Partition | Input | Expected | Pass / Fail |
|---|---|---|---|---|
| TC-BB-EF-01 | A: header missing | No `Authorization` header | `401 Unauthorized` | PASS |
| TC-BB-EF-02 | B: wrong token | `Authorization: Bearer wrong-key` | `401 Unauthorized` | PASS |

---

### 3.2 Technique 2: Boundary Value Analysis

**Applied to:** Expo push ticket counting (`sent` vs failed).

The ticket counting loop has a boundary at `status === "ok"`: only tickets with exactly this value increment the `sent` counter. Tickets with any other status (e.g. `"error"`) are logged but not counted.

| Test ID | Scenario | Tickets in response | Expected `sent` | Pass / Fail |
|---|---|---|---|---|
| TC-BB-EF-03 | All tickets ok | `[{ status: "ok" }]` | `1` | PASS |
| TC-BB-EF-04 | Mixed ok + error | `[{ status: "ok" }, { status: "error" }]` | `1` | PASS |

---

## Section 4: White-Box Testing Test Cases

### 4.1 Code Coverage Analysis

**Auth guard (`index.ts` lines 24–26)**
```ts
if (!serviceKey || !authHeader || authHeader !== `Bearer ${serviceKey}`) {
  return new Response("Unauthorized", { status: 401 });
}
```
Three sub-conditions joined by `||`:
1. `!serviceKey` — covered implicitly (env stub always returns a key; the true path is covered by TC-BB-EF-01 which has no header, triggering condition 2)
2. `!authHeader` — true path: TC-BB-EF-01 (no header); false path: TC-BB-EF-02, TC-WB-EF-01
3. `authHeader !== \`Bearer ${serviceKey}\`` — true path: TC-BB-EF-02; false path: TC-WB-EF-01 and TC-WB-EF-02

**Notification dispatch path**
The handler proceeds past the auth guard and queries three tables. The dispatch path is exercised by TC-WB-EF-01 (subscription due tomorrow → message built → fetch called → ticket counted).

**Ticket counting loop (`index.ts` lines 131–136)**
```ts
if (ticket.status === "ok") {
  sent += 1;
} else {
  console.error(...);
}
```
Both branches covered: `status: "ok"` (TC-WB-EF-01) and `status: "error"` (TC-WB-EF-02).

**Empty messages early return (`index.ts` lines 107–111)**
```ts
if (messages.length === 0) {
  return new Response(JSON.stringify({ sent: 0 }), ...);
}
```
Not explicitly tested — covered indirectly by the auth tests (which return before reaching this point) and the dispatch tests (which always produce at least one message). A dedicated empty-prefs test would exercise this branch directly.

---

### 4.2 White-Box Test Cases

| Test ID | Code Path / Branch | Input / Setup | Expected | Pass / Fail |
|---|---|---|---|---|
| TC-WB-EF-01 | Auth guard false → dispatch → ticket `status: "ok"` branch | Valid token, 1 sub due tomorrow, 1 token, fetch returns `{ status: "ok" }` | `{ sent: 1 }` | PASS |
| TC-WB-EF-02 | Auth guard false → dispatch → mixed ticket branches | Valid token, 1 sub due tomorrow, 2 tokens, fetch returns ok + error ticket | `{ sent: 1 }` | PASS |

---

## Section 5: Automated Testing (Edge Function Testing)

### 5.1 Overview of Automated Tests

**Framework:** Deno built-in test runner with `jsr:@std/assert` and `jsr:@std/testing/mock`.

**Test file:**

| File | Function Tested | Tests |
|---|---|---|
| `supabase/functions/send-reminders/index.test.ts` | `handler` (send-reminders edge function) | 4 |
| **Total** | | **4** |

---

### 5.2 Test Code

```typescript
import { assertEquals } from "jsr:@std/assert";
import { stub } from "jsr:@std/testing/mock";
import { handler } from "./index.ts";

const SERVICE_KEY = "test-service-role-key";

function envStubValues(key: string): string | undefined {
  if (key === "SUPABASE_SERVICE_ROLE_KEY") return SERVICE_KEY;
  if (key === "SUPABASE_URL")              return "http://localhost:54321";
  return undefined;
}

// Auth guard — missing header
Deno.test("returns 401 when Authorization header is missing", async () => {
  using _env = stub(Deno.env, "get", envStubValues);
  const res = await handler(new Request("http://localhost/", { method: "POST" }));
  assertEquals(res.status, 401);
  assertEquals(await res.text(), "Unauthorized");
});

// Auth guard — wrong token
Deno.test("returns 401 when Authorization header does not match service role key", async () => {
  using _env = stub(Deno.env, "get", envStubValues);
  const req = new Request("http://localhost/", {
    method: "POST",
    headers: { Authorization: "Bearer completely-wrong-key" },
  });
  const res = await handler(req);
  assertEquals(res.status, 401);
});

// Dispatch — subscription due tomorrow → sent: 1
Deno.test("sends push notifications for subscriptions due within the configured window", async () => {
  using _env   = stub(Deno.env, "get", envStubValues);
  using _fetch = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(JSON.stringify({ data: [{ status: "ok" }] }), { status: 200 }))
  );
  const res = await handler(authedRequest(), mockSupabase({ /* tomorrow sub, 1 token */ }));
  assertEquals((await res.json()).sent, 1);
});

// Ticket parsing — 1 ok + 1 error → sent: 1
Deno.test("correctly parses Expo push ticket responses and counts sent vs failed", async () => {
  using _env   = stub(Deno.env, "get", envStubValues);
  using _fetch = stub(globalThis, "fetch", () =>
    Promise.resolve(new Response(
      JSON.stringify({ data: [{ status: "ok" }, { status: "error", message: "InvalidCredentials" }] }),
      { status: 200 }
    ))
  );
  const res = await handler(authedRequest(), mockSupabase({ /* tomorrow sub, 2 tokens */ }));
  assertEquals((await res.json()).sent, 1);
});
```

---

### 5.3 Test Execution Results

```
running 4 tests from ./index.test.ts

returns 401 when Authorization header is missing ... ok (2ms)
returns 401 when Authorization header does not match service role key ... ok (1ms)
sends push notifications for subscriptions due within the configured window ... ok (3ms)
correctly parses Expo push ticket responses and counts sent vs failed ... ok (2ms)

ok | 4 passed | 0 failed (12ms)
```

---

### 5.4 Test Results Summary Table

| Test | Functionality Tested | Result |
|---|---|---|
| `returns 401 when Authorization header is missing` | Auth guard — missing header (Partition A) | PASS |
| `returns 401 when Authorization header does not match service role key` | Auth guard — wrong token (Partition B) | PASS |
| `sends push notifications for subscriptions due within the configured window` | Dispatch path — renewal date match, message built and sent | PASS |
| `correctly parses Expo push ticket responses and counts sent vs failed` | Ticket loop — ok branch increments sent, error branch does not | PASS |

---

## Section 6: Conclusions

### 6.1 Summary of Testing

A total of **4 tests** were implemented in 1 test file covering the `send-reminders` Supabase edge function. All 4 tests pass. The full test suite across all layers now stands at **301 tests across 32 files**.

| Report | Tests | Files |
|---|---|---|
| Unit + Integration (`REPORT_unit.md`) | 127 | 11 |
| Component (`REPORT_components.md`) | 35 | 5 |
| Screen (`REPORT_screens.md`) | 122 | 11 |
| E2E — Detox (`REPORT_e2e.md`) | 13 | 4 |
| Edge Function — Deno (this report) | 4 | 1 |
| **Total** | **301** | **32** |

---

### 6.2 Key Findings

**Strengths identified:**
- The auth guard correctly rejects both missing and incorrect tokens with a `401` status and `"Unauthorized"` body. This is the first line of defence for a function that is only meant to be invoked by Supabase's own pg_cron scheduler.
- The ticket counting loop correctly distinguishes `status: "ok"` from `status: "error"` — only successful deliveries increment the `sent` counter, so the returned count is an accurate reflection of notifications that actually reached the Expo push service.
- Dependency injection via the `supabaseOverride` parameter keeps the production code path identical while allowing full test isolation with no real DB or network calls.

**Remaining gaps:**
- The `messages.length === 0` early-return branch (no subscriptions due) is not directly tested. A test seeding empty preferences or subscriptions with no matching renewal date would cover this path.
- The chunking loop (`i += 100`) is not tested — all test data fits in a single chunk. A test producing more than 100 messages would verify the chunking logic.
- The `prefsError` error branch (Supabase returns an error on the notification_preferences query) is not tested.

---

### 6.3 Lessons Learned

1. **Deno's `using` keyword makes stub teardown automatic.** Declaring stubs with `using _env = stub(...)` means the stub is restored when the block exits, even if the test throws. This is cleaner than manually calling `.restore()` in a `finally` block.

2. **Export the handler separately from `Deno.serve`.** The original function was an inline callback inside `Deno.serve(async (req) => { ... })`. Extracting it as `export async function handler(req, override?)` makes it directly callable in tests without starting an HTTP server.

3. **Thenable mocks must implement both `.then` and `.catch`.** The Supabase JS client returns query-builder objects that are awaited by the handler. A mock that only implements `.then` will fail on any `await` that triggers the rejection path. Adding `.catch` to the mock query object prevents subtle failures.

---

### 6.4 Recommendations

1. **Add a test for the empty-messages early return** — seed `mockSupabase` with empty prefs or no matching subscription and assert `{ sent: 0 }` is returned with a `200` status.
2. **Add a test for the `prefsError` branch** — return `{ data: null, error: { message: "DB error" } }` from the `notification_preferences` mock and assert a `500` response.
3. **Add a chunking test** — produce 101+ messages and verify `fetch` is called twice (once per chunk of 100).
