// Tests for useSubscriptionsStore in store/subscriptionsStore.ts.
// Date tested: 2026-05-25
// Zustand stores expose a .getState() method that lets us read and write
// state directly without rendering any React components — no device needed.
import { useSubscriptionsStore } from "@/store/subscriptionsStore";

// Helper that builds a minimal valid Subscription object for a given id.
const mockSub = (id: string): Subscription => ({
  id,
  icon: { uri: `https://example.com/${id}.png` },
  name: `Service ${id}`,
  price: 9.99,
  currency: "EUR",
  billing: "Monthly",
  status: "active",
});

// Reset the store to its blank initial state before every test so that
// no test can affect the state seen by a subsequent test.
beforeEach(() => {
  useSubscriptionsStore.getState().resetSubscriptions();
});

describe("setSubscriptions", () => {
  // Calling setSubscriptions replaces whatever is in the list with the new array.
  it("replaces the entire subscription list", () => {
    useSubscriptionsStore.getState().setSubscriptions([mockSub("a"), mockSub("b")]);
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(2);
  });

  // Passing an empty array should wipe the list completely.
  it("clears the list when given an empty array", () => {
    useSubscriptionsStore.getState().setSubscriptions([mockSub("a")]);
    useSubscriptionsStore.getState().setSubscriptions([]);
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(0);
  });
});

describe("addSubscription", () => {
  // New subscriptions are prepended so the most recently added item appears first.
  it("prepends the new subscription to the front of the list", () => {
    useSubscriptionsStore.getState().addSubscription(mockSub("first"));
    useSubscriptionsStore.getState().addSubscription(mockSub("second"));
    expect(useSubscriptionsStore.getState().subscriptions[0].id).toBe("second");
  });

  // Adding to an empty store should result in exactly one item.
  it("adds to an empty list", () => {
    useSubscriptionsStore.getState().addSubscription(mockSub("a"));
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(1);
  });

  // Each call should increase the list length by one.
  it("increases the list length with each addition", () => {
    useSubscriptionsStore.getState().addSubscription(mockSub("a"));
    useSubscriptionsStore.getState().addSubscription(mockSub("b"));
    useSubscriptionsStore.getState().addSubscription(mockSub("c"));
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(3);
  });
});

describe("deleteSubscription", () => {
  // Only the item whose id matches should be removed; all others stay.
  it("removes the subscription with the matching id", () => {
    useSubscriptionsStore.getState().setSubscriptions([mockSub("a"), mockSub("b"), mockSub("c")]);
    useSubscriptionsStore.getState().deleteSubscription("b");
    const ids = useSubscriptionsStore.getState().subscriptions.map((s) => s.id);
    expect(ids).toEqual(["a", "c"]);
  });

  // Deleting an id that does not exist should leave the list completely unchanged.
  it("leaves the list unchanged when the id is not found", () => {
    useSubscriptionsStore.getState().setSubscriptions([mockSub("a")]);
    useSubscriptionsStore.getState().deleteSubscription("z");
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(1);
  });

  // Deleting the only item in the list should result in an empty list.
  it("results in an empty list when the only item is deleted", () => {
    useSubscriptionsStore.getState().addSubscription(mockSub("a"));
    useSubscriptionsStore.getState().deleteSubscription("a");
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(0);
  });
});

describe("updateSubscription", () => {
  // The matching subscription should be replaced with the updated version.
  it("replaces the subscription with the matching id", () => {
    const original = mockSub("a");
    const updated = { ...original, price: 19.99 };
    useSubscriptionsStore.getState().setSubscriptions([original, mockSub("b")]);
    useSubscriptionsStore.getState().updateSubscription(updated);
    const result = useSubscriptionsStore.getState().subscriptions.find((s) => s.id === "a");
    expect(result?.price).toBe(19.99);
  });

  // Subscriptions that do not match the updated id must not be changed.
  it("does not modify other subscriptions", () => {
    useSubscriptionsStore.getState().setSubscriptions([mockSub("a"), mockSub("b")]);
    useSubscriptionsStore.getState().updateSubscription({ ...mockSub("a"), price: 50 });
    const b = useSubscriptionsStore.getState().subscriptions.find((s) => s.id === "b");
    expect(b?.price).toBe(9.99);
  });

  // The list length must stay the same after an update — no duplicates, no deletions.
  it("keeps the same list length after an update", () => {
    useSubscriptionsStore.getState().setSubscriptions([mockSub("a"), mockSub("b")]);
    useSubscriptionsStore.getState().updateSubscription({ ...mockSub("a"), name: "Updated" });
    expect(useSubscriptionsStore.getState().subscriptions).toHaveLength(2);
  });
});

describe("setLoading", () => {
  // setLoading(true) must flip isLoading to true.
  it("sets isLoading to true", () => {
    useSubscriptionsStore.getState().setLoading(true);
    expect(useSubscriptionsStore.getState().isLoading).toBe(true);
  });

  // setLoading(false) must flip isLoading back to false.
  it("sets isLoading to false", () => {
    useSubscriptionsStore.getState().setLoading(true);
    useSubscriptionsStore.getState().setLoading(false);
    expect(useSubscriptionsStore.getState().isLoading).toBe(false);
  });
});

describe("resetSubscriptions", () => {
  // After reset the subscription list must be empty and isLoading must be false,
  // regardless of what state the store was in before.
  it("clears all subscriptions and resets isLoading", () => {
    useSubscriptionsStore.getState().setSubscriptions([mockSub("a"), mockSub("b")]);
    useSubscriptionsStore.getState().setLoading(true);
    useSubscriptionsStore.getState().resetSubscriptions();
    const { subscriptions, isLoading } = useSubscriptionsStore.getState();
    expect(subscriptions).toHaveLength(0);
    expect(isLoading).toBe(false);
  });
});
