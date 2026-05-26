// Tests for app/(tabs)/subscriptions.tsx
// Date tested: 2026-05-25
//
// Mocks:
//   @clerk/expo              — useAuth provides userId without a real Clerk session.
//   @expo/vector-icons       — Ionicons requires native font assets unavailable
//                              in the Node.js test environment.
//   @/hooks/useSupabase      — returns an empty object; no Supabase client created.
//   @/services/subscriptions — delete / update services replaced with no-op stubs.
//   @/components/SubscriptionCard — complex component with icon/SVG dependencies;
//                              replaced with a minimal stub that renders the name
//                              so the filter and count tests can locate rendered items.
//   @/components/CreateSubscriptionModal — replaced with a null stub; edit-modal
//                              behaviour is out of scope for these screen-level tests.
//   react-native-safe-area-context — SafeAreaView requires native context;
//                              replaced with a passthrough View.

jest.mock("@clerk/expo", () => ({
  useAuth: () => ({ userId: "user-123" }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({}),
}));

jest.mock("@/services/subscriptions", () => ({
  deleteSubscription: jest.fn().mockResolvedValue(undefined),
  updateSubscription: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/components/SubscriptionCard", () => {
  const React = require("react");
  const { Text } = require("react-native");
  const MockSubscriptionCard = ({ name }: any) => React.createElement(Text, null, name);
  MockSubscriptionCard.displayName = "SubscriptionCard";
  return MockSubscriptionCard;
});

jest.mock("@/components/CreateSubscriptionModal", () => () => null);

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import Subscriptions from "@/app/(tabs)/subscriptions";
import { useSubscriptionsStore } from "@/store/subscriptionsStore";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSub(id: string, overrides: any = {}): Subscription {
  return {
    id,
    name:        `Sub ${id}`,
    price:       9.99,
    billing:     "Monthly",
    icon:        { uri: "https://example.com/icon.png" },
    category:    "Entertainment",
    renewalDate: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

// Reset store and mock state between tests.
beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptionsStore.getState().resetSubscriptions();
});

// ─── Subscriptions screen ─────────────────────────────────────────────────────

describe("Subscriptions screen — rendering", () => {
  // The screen title must be present so the user knows they are on the payments list.
  it("renders the All Payments title", () => {
    const { getByText } = render(<Subscriptions />);
    expect(getByText("All Payments")).toBeTruthy();
  });

  // The search input must be present so the user can filter subscriptions by name.
  it("renders the search input", () => {
    const { getByPlaceholderText } = render(<Subscriptions />);
    expect(getByPlaceholderText("Search payments...")).toBeTruthy();
  });

  // With an empty store the count must show zero.
  it("shows '0 payments' when the store is empty", () => {
    const { getByText } = render(<Subscriptions />);
    expect(getByText("0 payments")).toBeTruthy();
  });

  // The empty-state message must appear when there are no matching subscriptions.
  it("shows the empty-state message when no subscriptions exist", () => {
    const { getByText } = render(<Subscriptions />);
    expect(getByText("No payments found.")).toBeTruthy();
  });
});

describe("Subscriptions screen — payment count", () => {
  // Singular "payment" must be used when exactly one subscription is visible.
  it("shows '1 payment' (singular) for exactly one subscription", () => {
    useSubscriptionsStore.getState().setSubscriptions([makeSub("a")]);
    const { getByText } = render(<Subscriptions />);
    expect(getByText("1 payment")).toBeTruthy();
  });

  // Plural "payments" must be used when more than one subscription is visible.
  it("shows '2 payments' (plural) for two subscriptions", () => {
    useSubscriptionsStore.getState().setSubscriptions([makeSub("a"), makeSub("b")]);
    const { getByText } = render(<Subscriptions />);
    expect(getByText("2 payments")).toBeTruthy();
  });
});

describe("Subscriptions screen — search", () => {
  // Typing a name query must show only the matching subscription.
  it("filters cards to show only the matched name", () => {
    useSubscriptionsStore.getState().setSubscriptions([
      makeSub("a", { name: "Netflix" }),
      makeSub("b", { name: "Spotify" }),
    ]);
    const { getByPlaceholderText, getByText, queryByText } = render(<Subscriptions />);
    fireEvent.changeText(getByPlaceholderText("Search payments..."), "Netflix");
    expect(getByText("Netflix")).toBeTruthy();
    expect(queryByText("Spotify")).toBeNull();
  });

  // When the query matches nothing the count must drop to zero.
  it("shows '0 payments' when the search query matches nothing", () => {
    useSubscriptionsStore.getState().setSubscriptions([makeSub("a", { name: "Netflix" })]);
    const { getByPlaceholderText, getByText } = render(<Subscriptions />);
    fireEvent.changeText(getByPlaceholderText("Search payments..."), "zzznomatch");
    expect(getByText("0 payments")).toBeTruthy();
  });
});
