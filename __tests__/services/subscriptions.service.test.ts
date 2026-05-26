// Integration tests for the Supabase service functions in services/subscriptions.ts.
// Date tested: 2026-05-25
// Instead of hitting a real database, each test passes a mock Supabase client
// that mimics the chained query builder API and returns controlled test data.
// This lets us verify that the service functions handle success and error cases
// correctly without any network connection.
import {
  createSubscription,
  deleteSubscription,
  fetchSubscriptions,
  updateSubscription,
} from "@/services/subscriptions";

// Builds a lightweight mock of the Supabase client query builder chain.
// Supabase uses a fluent API (e.g. .from().select().eq().order()) where every
// method returns a new builder object.  Here every method returns the same
// chain object so any call sequence terminates correctly.
// data and error are set as direct properties so that destructuring
// ({ data, error } = await chain) always resolves with the intended values.
function makeMockClient(returnData: any, returnError: any = null) {
  const chain: any = {
    data: returnData,
    error: returnError,
    select: () => chain,
    eq:     () => chain,
    order:  () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    single: () => chain,
  };
  return { from: () => chain };
}

// A realistic database row matching the subscriptions table schema.
const sampleRow = {
  id:           "uuid-123",
  user_id:      "user-abc",
  name:         "Netflix",
  price:        9.99,
  currency:     "EUR",
  billing:      "Monthly",
  frequency:    "Monthly",
  category:     "Entertainment",
  status:       "active",
  start_date:   "2024-01-01T00:00:00.000Z",
  renewal_date: "2024-02-01T00:00:00.000Z",
  icon_url:     "https://logos-api.apistemic.com/domain:netflix.com",
  color:        "#ffd6a5",
};

// A Subscription object as the app would create it before saving.
const newSub: Subscription = {
  id:       "temp-id",
  icon:     { uri: "https://logos-api.apistemic.com/domain:netflix.com" },
  name:     "Netflix",
  price:    9.99,
  currency: "EUR",
  billing:  "Monthly",
  status:   "active",
};

describe("fetchSubscriptions", () => {
  // When Supabase returns rows the function should map them all to Subscription
  // objects using rowToSubscription and return the array.
  it("returns mapped subscriptions on success", async () => {
    const client = makeMockClient([sampleRow]);
    const result = await fetchSubscriptions(client as any, "user-abc");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Netflix");
    expect(result[0].icon).toEqual({ uri: "https://logos-api.apistemic.com/domain:netflix.com" });
  });

  // When the user has no subscriptions Supabase returns an empty array —
  // the function should return an empty array without errors.
  it("returns an empty array when there are no subscriptions", async () => {
    const client = makeMockClient([]);
    const result = await fetchSubscriptions(client as any, "user-abc");
    expect(result).toHaveLength(0);
  });

  // When Supabase sets error the function must throw so the caller can handle it.
  it("throws when Supabase returns an error", async () => {
    const client = makeMockClient(null, new Error("DB error"));
    await expect(fetchSubscriptions(client as any, "user-abc")).rejects.toThrow("DB error");
  });
});

describe("createSubscription", () => {
  // On success the function should return the saved subscription using the
  // Supabase-generated UUID, not the client-side temporary id.
  it("returns the saved subscription with the Supabase-generated id", async () => {
    const client = makeMockClient(sampleRow);
    const result = await createSubscription(client as any, newSub, "user-abc");
    expect(result.id).toBe("uuid-123");
    expect(result.name).toBe("Netflix");
  });

  // A successful create should return a properly mapped Subscription object
  // with the icon wrapped as { uri }.
  it("returns a correctly mapped Subscription object", async () => {
    const client = makeMockClient(sampleRow);
    const result = await createSubscription(client as any, newSub, "user-abc");
    expect(result.icon).toEqual({ uri: "https://logos-api.apistemic.com/domain:netflix.com" });
    expect(result.currency).toBe("EUR");
  });

  // When the insert fails the function must throw the Supabase error.
  it("throws when Supabase returns an error", async () => {
    const client = makeMockClient(null, new Error("Insert failed"));
    await expect(createSubscription(client as any, newSub, "user-abc")).rejects.toThrow("Insert failed");
  });
});

describe("updateSubscription", () => {
  const existingSub: Subscription = {
    id:       "uuid-123",
    icon:     { uri: "https://logos-api.apistemic.com/domain:netflix.com" },
    name:     "Netflix",
    price:    14.99,
    currency: "EUR",
    billing:  "Monthly",
    status:   "active",
  };

  // On success the function should return the updated values from the database.
  it("returns the updated subscription on success", async () => {
    const updatedRow = { ...sampleRow, price: 14.99 };
    const client = makeMockClient(updatedRow);
    const result = await updateSubscription(client as any, existingSub, "user-abc");
    expect(result.price).toBe(14.99);
  });

  // When the update fails the function must throw rather than returning stale data.
  it("throws when Supabase returns an error", async () => {
    const client = makeMockClient(null, new Error("Update failed"));
    await expect(updateSubscription(client as any, existingSub, "user-abc")).rejects.toThrow("Update failed");
  });
});

describe("deleteSubscription", () => {
  // A successful delete should resolve with no return value (void).
  it("resolves without a return value on success", async () => {
    const client = makeMockClient(null, null);
    await expect(
      deleteSubscription(client as any, "uuid-123", "user-abc")
    ).resolves.toBeUndefined();
  });

  // When the delete fails the function must throw so the caller can roll back
  // the optimistic UI update.
  it("throws when Supabase returns an error", async () => {
    const client = makeMockClient(null, new Error("Delete failed"));
    await expect(
      deleteSubscription(client as any, "uuid-123", "user-abc")
    ).rejects.toThrow("Delete failed");
  });
});
