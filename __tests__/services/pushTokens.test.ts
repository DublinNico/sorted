// Tests for upsertPushToken() and deletePushToken()
// in services/pushTokens.ts.
// Date tested: 2026-05-25
// A mock Supabase client is used so no real database connection is required.
import {
  deletePushToken,
  upsertPushToken,
} from "@/services/pushTokens";

// Builds a lightweight mock of the Supabase client query builder chain.
// upsert(), delete(), and eq() cover all the calls made by push token functions.
function makeMockClient(returnError: any = null) {
  const chain: any = {
    data:   null,
    error:  returnError,
    upsert: () => chain,
    delete: () => chain,
    eq:     () => chain,
  };
  return { from: () => chain };
}

// ─── upsertPushToken ──────────────────────────────────────────────────────────

describe("upsertPushToken", () => {
  // A successful upsert should resolve without a return value — push token
  // registration is fire-and-forget from the caller's perspective.
  it("resolves without a return value on success", async () => {
    const client = makeMockClient(null);
    await expect(
      upsertPushToken(client as any, "user-abc", "ExponentPushToken[test]")
    ).resolves.toBeUndefined();
  });

  // When Supabase returns an error the function must throw so the calling
  // code can log the failure and retry if needed.
  it("throws when Supabase returns an error", async () => {
    const client = makeMockClient(new Error("Upsert failed"));
    await expect(
      upsertPushToken(client as any, "user-abc", "ExponentPushToken[test]")
    ).rejects.toThrow("Upsert failed");
  });
});

// ─── deletePushToken ──────────────────────────────────────────────────────────

describe("deletePushToken", () => {
  // A successful delete should resolve without a return value — this is called
  // on sign-out to stop the user receiving notifications after logging out.
  it("resolves without a return value on success", async () => {
    const client = makeMockClient(null);
    await expect(
      deletePushToken(client as any, "user-abc", "ExponentPushToken[test]")
    ).resolves.toBeUndefined();
  });

  // When Supabase returns an error the function must throw so the caller knows
  // the token was not removed and can attempt cleanup again.
  it("throws when Supabase returns an error", async () => {
    const client = makeMockClient(new Error("Delete failed"));
    await expect(
      deletePushToken(client as any, "user-abc", "ExponentPushToken[test]")
    ).rejects.toThrow("Delete failed");
  });
});
