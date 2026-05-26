// Tests for getNotificationPrefs() and upsertNotificationPrefs()
// in services/notificationPrefs.ts.
// Date tested: 2026-05-25
// A mock Supabase client is used so no real database connection is required.
import {
  getNotificationPrefs,
  upsertNotificationPrefs,
} from "@/services/notificationPrefs";

// Builds a lightweight mock of the Supabase client query builder chain.
// maybeSingle() and upsert() are included to cover the calls made by
// notification preference service functions.
function makeMockClient(returnData: any, returnError: any = null) {
  const chain: any = {
    data:        returnData,
    error:       returnError,
    select:      () => chain,
    eq:          () => chain,
    maybeSingle: () => chain,
    upsert:      () => chain,
  };
  return { from: () => chain };
}

// ─── getNotificationPrefs ─────────────────────────────────────────────────────

describe("getNotificationPrefs", () => {
  // When Supabase returns a row the function should map it to a NotificationPrefs
  // object, converting the snake_case days_before column to camelCase daysBefore.
  it("returns mapped prefs when a row is found", async () => {
    const client = makeMockClient({ enabled: false, days_before: [1, 7] });
    const result = await getNotificationPrefs(client as any, "user-abc");
    expect(result.enabled).toBe(false);
    expect(result.daysBefore).toEqual([1, 7]);
  });

  // When the user has no saved preferences (first time opening the app) Supabase
  // returns null via maybeSingle().  The function should return the safe defaults
  // rather than throwing or returning undefined.
  it("returns default prefs when no row exists", async () => {
    const client = makeMockClient(null);
    const result = await getNotificationPrefs(client as any, "user-abc");
    expect(result.enabled).toBe(true);
    expect(result.daysBefore).toEqual([1, 3, 7]);
  });

  // The returned defaults must be a fresh copy each time so that one caller
  // mutating the array cannot affect a subsequent caller.
  it("returns a new copy of the defaults array each call", async () => {
    const client = makeMockClient(null);
    const first  = await getNotificationPrefs(client as any, "user-abc");
    const second = await getNotificationPrefs(client as any, "user-abc");
    expect(first.daysBefore).not.toBe(second.daysBefore);
  });

  // When Supabase sets error the function must throw so the calling screen
  // can display an error state.
  it("throws when Supabase returns an error", async () => {
    const client = makeMockClient(null, new Error("DB error"));
    await expect(getNotificationPrefs(client as any, "user-abc")).rejects.toThrow("DB error");
  });
});

// ─── upsertNotificationPrefs ──────────────────────────────────────────────────

describe("upsertNotificationPrefs", () => {
  // A successful upsert should resolve without returning a value — the caller
  // only needs to know it didn't fail.
  it("resolves without a return value on success", async () => {
    const client = makeMockClient(null, null);
    await expect(
      upsertNotificationPrefs(client as any, "user-abc", { enabled: true, daysBefore: [1, 3] })
    ).resolves.toBeUndefined();
  });

  // When Supabase returns an error the function must throw so the UI can
  // roll back any optimistic state change.
  it("throws when Supabase returns an error", async () => {
    const client = makeMockClient(null, new Error("Upsert failed"));
    await expect(
      upsertNotificationPrefs(client as any, "user-abc", { enabled: true, daysBefore: [1] })
    ).rejects.toThrow("Upsert failed");
  });
});
