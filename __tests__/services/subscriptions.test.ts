// Tests for rowToSubscription() and subscriptionToRow() in services/subscriptions.ts.
// Date tested: 2026-05-25
// These two functions convert between the Supabase database row format (snake_case)
// and the app's internal Subscription type (camelCase).  Correct mapping is critical
// because any field mismatch would cause silent data corruption across the whole app.
import { rowToSubscription, subscriptionToRow } from "@/services/subscriptions";

// A realistic database row used as input for rowToSubscription tests.
const sampleRow = {
  id: "uuid-123",
  user_id: "user-abc",
  name: "Netflix",
  price: 9.99,
  currency: "EUR",
  billing: "Monthly",
  frequency: "Monthly",
  category: "Entertainment",
  status: "active",
  start_date: "2024-01-01T00:00:00.000Z",
  renewal_date: "2024-02-01T00:00:00.000Z",
  icon_url: "https://logos-api.apistemic.com/domain:netflix.com",
  color: "#ffd6a5",
};

describe("rowToSubscription", () => {
  // The UUID primary key from the database must be preserved exactly on the
  // returned Subscription object.
  it("maps id correctly", () => {
    expect(rowToSubscription(sampleRow as any).id).toBe("uuid-123");
  });

  // Core financial and billing fields should be copied directly without
  // transformation.
  it("maps name, price, currency, billing", () => {
    const sub = rowToSubscription(sampleRow as any);
    expect(sub.name).toBe("Netflix");
    expect(sub.price).toBe(9.99);
    expect(sub.currency).toBe("EUR");
    expect(sub.billing).toBe("Monthly");
  });

  // The flat icon_url string from the DB must be wrapped in a React Native
  // ImageSource object ({ uri }) so it can be passed directly to <Image>.
  it("maps icon as { uri: icon_url }", () => {
    const sub = rowToSubscription(sampleRow as any);
    expect(sub.icon).toEqual({ uri: "https://logos-api.apistemic.com/domain:netflix.com" });
  });

  // The snake_case column start_date must map to the camelCase field startDate.
  it("maps startDate from start_date", () => {
    expect(rowToSubscription(sampleRow as any).startDate).toBe("2024-01-01T00:00:00.000Z");
  });

  // The snake_case column renewal_date must map to the camelCase field renewalDate.
  it("maps renewalDate from renewal_date", () => {
    expect(rowToSubscription(sampleRow as any).renewalDate).toBe("2024-02-01T00:00:00.000Z");
  });

  // The remaining metadata fields — category, status, frequency, color — must all
  // be copied across without modification.
  it("maps category, status, frequency, color", () => {
    const sub = rowToSubscription(sampleRow as any);
    expect(sub.category).toBe("Entertainment");
    expect(sub.status).toBe("active");
    expect(sub.frequency).toBe("Monthly");
    expect(sub.color).toBe("#ffd6a5");
  });
});

// A realistic Subscription object used as input for subscriptionToRow tests.
const baseSub = {
  icon: { uri: "https://logos-api.apistemic.com/domain:netflix.com" },
  name: "Netflix",
  price: 9.99,
  currency: "EUR",
  billing: "Monthly",
  frequency: "Monthly",
  category: "Entertainment",
  status: "active",
  startDate: "2024-01-01T00:00:00.000Z",
  renewalDate: "2024-02-01T00:00:00.000Z",
  color: "#ffd6a5",
};

describe("subscriptionToRow", () => {
  // The userId argument must be written to the user_id column, which is required
  // by Supabase's Row Level Security policies.
  it("maps user_id correctly", () => {
    expect(subscriptionToRow(baseSub as any, "user-abc").user_id).toBe("user-abc");
  });

  // Core billing fields must be copied directly from the Subscription to the row.
  it("maps name, price, billing, currency", () => {
    const row = subscriptionToRow(baseSub as any, "user-abc");
    expect(row.name).toBe("Netflix");
    expect(row.price).toBe(9.99);
    expect(row.billing).toBe("Monthly");
    expect(row.currency).toBe("EUR");
  });

  // The icon { uri } object must be unpacked — only the URI string is stored in
  // the database, not the React Native ImageSource wrapper.
  it("extracts icon_url from icon.uri", () => {
    expect(subscriptionToRow(baseSub as any, "user-abc").icon_url).toBe(
      "https://logos-api.apistemic.com/domain:netflix.com"
    );
  });

  // The camelCase field startDate must map to the snake_case column start_date.
  it("maps start_date from startDate", () => {
    expect(subscriptionToRow(baseSub as any, "user-abc").start_date).toBe(
      "2024-01-01T00:00:00.000Z"
    );
  });

  // The camelCase field renewalDate must map to the snake_case column renewal_date.
  it("maps renewal_date from renewalDate", () => {
    expect(subscriptionToRow(baseSub as any, "user-abc").renewal_date).toBe(
      "2024-02-01T00:00:00.000Z"
    );
  });

  // When an existing UUID is passed as the third argument (update scenario), it
  // must be included in the row so Supabase targets the correct record.
  it("includes id field when provided", () => {
    const row = subscriptionToRow(baseSub as any, "user-abc", "my-id");
    expect(row.id).toBe("my-id");
  });

  // When no id is provided (insert scenario), the id field must be absent so
  // Supabase generates a new UUID rather than inserting a blank value.
  it("omits id field when not provided", () => {
    const row = subscriptionToRow(baseSub as any, "user-abc");
    expect(row.id).toBeUndefined();
  });

  // If the subscription has no currency set, the row must default to "EUR"
  // to match the database column default and avoid a constraint violation.
  it("defaults currency to EUR when undefined", () => {
    const sub = { ...baseSub, currency: undefined };
    expect(subscriptionToRow(sub as any, "u").currency).toBe("EUR");
  });

  // If the subscription has no category set, the row must default to "Other"
  // to satisfy the NOT NULL constraint on the category column.
  it("defaults category to Other when undefined", () => {
    const sub = { ...baseSub, category: undefined };
    expect(subscriptionToRow(sub as any, "u").category).toBe("Other");
  });

  // If the subscription has no status set, the row must default to "active"
  // to satisfy the NOT NULL constraint on the status column.
  it("defaults status to active when undefined", () => {
    const sub = { ...baseSub, status: undefined };
    expect(subscriptionToRow(sub as any, "u").status).toBe("active");
  });

  // If the icon field is not a { uri } object (e.g. a local require() number),
  // icon_url must be set to an empty string rather than throwing or storing garbage.
  it("sets icon_url to empty string for a non-uri icon value", () => {
    const sub = { ...baseSub, icon: 123 };
    expect(subscriptionToRow(sub as any, "u").icon_url).toBe("");
  });
});
