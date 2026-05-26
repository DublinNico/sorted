/**
 * supabase/functions/send-reminders/index.test.ts
 *
 * Deno unit tests for the send-reminders edge function.
 * Run with: deno test --allow-env index.test.ts
 *
 * Dependencies are injected so no real network calls are made:
 *   - Deno.env.get is stubbed to provide fake credentials.
 *   - A mock Supabase client is passed directly to handler().
 *   - globalThis.fetch is stubbed to return canned Expo push responses.
 */

import { assertEquals } from "jsr:@std/assert";
import { stub } from "jsr:@std/testing/mock";
import { handler } from "./index.ts";

// ─── Test constants ───────────────────────────────────────────────────────────

const SERVICE_KEY = "test-service-role-key";
const SUPABASE_URL = "http://localhost:54321";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * makeQuery
 * Returns a thenable, chainable object that resolves to `result`.
 * Mirrors the Supabase query-builder interface used by the handler.
 */
// deno-lint-ignore no-explicit-any
function makeQuery(result: { data: any[]; error: null | { message: string } }) {
  // deno-lint-ignore no-explicit-any
  const q: any = {
    select: () => q,
    eq: () => q,
    then: (resolve: (v: unknown) => unknown) => Promise.resolve(result).then(resolve),
    catch: (reject: (e: unknown) => unknown) => Promise.resolve(result).catch(reject),
  };
  return q;
}

/**
 * mockSupabase
 * Builds a minimal Supabase client mock that routes `.from(table)` calls
 * to the supplied fixture arrays.
 */
function mockSupabase(opts: {
  // deno-lint-ignore no-explicit-any
  prefs: any[];
  // deno-lint-ignore no-explicit-any
  subs: any[];
  // deno-lint-ignore no-explicit-any
  tokens: any[];
}) {
  return {
    // deno-lint-ignore no-explicit-any
    from: (table: string): any => {
      if (table === "notification_preferences") return makeQuery({ data: opts.prefs, error: null });
      if (table === "subscriptions")            return makeQuery({ data: opts.subs,  error: null });
      if (table === "push_tokens")              return makeQuery({ data: opts.tokens, error: null });
      return makeQuery({ data: [], error: null });
    },
  };
}

/** authedRequest — a POST with the correct Bearer token. */
function authedRequest(): Request {
  return new Request("http://localhost/", {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_KEY}` },
  });
}

/** envStubValues — returns fake env values for the two keys the handler needs. */
function envStubValues(key: string): string | undefined {
  if (key === "SUPABASE_SERVICE_ROLE_KEY") return SERVICE_KEY;
  if (key === "SUPABASE_URL")              return SUPABASE_URL;
  return undefined;
}

/** tomorrowDateString — YYYY-MM-DD for tomorrow, used to match days_before: [1]. */
function tomorrowDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ─── Auth guard tests ─────────────────────────────────────────────────────────

Deno.test("returns 401 when Authorization header is missing", async () => {
  using _env = stub(Deno.env, "get", envStubValues);

  const req = new Request("http://localhost/", { method: "POST" });
  const res = await handler(req);

  assertEquals(res.status, 401);
  assertEquals(await res.text(), "Unauthorized");
});

Deno.test("returns 401 when Authorization header does not match service role key", async () => {
  using _env = stub(Deno.env, "get", envStubValues);

  const req = new Request("http://localhost/", {
    method: "POST",
    headers: { Authorization: "Bearer completely-wrong-key" },
  });
  const res = await handler(req);

  assertEquals(res.status, 401);
  assertEquals(await res.text(), "Unauthorized");
});

// ─── Notification dispatch tests ──────────────────────────────────────────────

Deno.test("sends push notifications for subscriptions due within the configured window", async () => {
  using _env = stub(Deno.env, "get", envStubValues);

  const supabase = mockSupabase({
    prefs:  [{ user_id: "user-1", days_before: [1] }],
    subs:   [{ id: "sub-1", name: "Netflix", price: 15.99, currency: "EUR", renewal_date: tomorrowDateString() }],
    tokens: [{ token: "ExponentPushToken[abc123]" }],
  });

  // Expo push API returns one successful ticket.
  using _fetch = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(JSON.stringify({ data: [{ status: "ok" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
  );

  const res = await handler(authedRequest(), supabase);

  assertEquals(res.status, 200);
  assertEquals((await res.json()).sent, 1);
});

Deno.test("correctly parses Expo push ticket responses and counts sent vs failed", async () => {
  using _env = stub(Deno.env, "get", envStubValues);

  // Two tokens → two messages → two tickets in the response.
  const supabase = mockSupabase({
    prefs:  [{ user_id: "user-1", days_before: [1] }],
    subs:   [{ id: "sub-1", name: "Spotify", price: 9.99, currency: "EUR", renewal_date: tomorrowDateString() }],
    tokens: [
      { token: "ExponentPushToken[good]" },
      { token: "ExponentPushToken[bad]"  },
    ],
  });

  // First ticket succeeds, second fails — only 1 should be counted as sent.
  using _fetch = stub(globalThis, "fetch", () =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          data: [
            { status: "ok" },
            { status: "error", message: "InvalidCredentials" },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    )
  );

  const res = await handler(authedRequest(), supabase);

  assertEquals(res.status, 200);
  assertEquals((await res.json()).sent, 1);
});
