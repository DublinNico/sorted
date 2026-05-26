// Tests for app/(tabs)/index.tsx  (HomeScreen)
// Date tested: 2026-05-25
//
// Mocks:
//   @clerk/expo              — useUser provides a controlled user object without
//                              a real Clerk session.
//   @expo/vector-icons       — Ionicons requires native font assets unavailable
//                              in the Node.js test environment.
//   expo-router              — useRouter provides navigation stubs.
//   react-native-svg         — Svg / Path / G require a native SVG renderer;
//                              replaced with passthrough / null stubs.
//   @/constants/icons        — imports .png files that are not transformed by
//                              jest-expo in node testEnvironment; replaced with
//                              numeric stubs (valid ImageSourcePropType for tests).
//   react-native-safe-area-context — SafeAreaView requires native context;
//                              replaced with a passthrough View.

jest.mock("@clerk/expo", () => ({
  useUser: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ navigate: jest.fn(), back: jest.fn() }),
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  return {
    Svg:  ({ children }: any) => React.createElement(React.Fragment, null, children),
    Path: () => null,
    G:    ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

jest.mock("@/constants/icons", () => ({
  icons: {
    wallet:   1,
    home:     1,
    setting:  1,
    activity: 1,
    add:      1,
    back:     1,
    menu:     1,
    plus:     1,
  },
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

import React from "react";
import { render } from "@testing-library/react-native";
import { useUser } from "@clerk/expo";
import HomeScreen from "@/app/(tabs)/index";
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
    renewalDate: "2099-06-01T00:00:00.000Z",
    ...overrides,
  };
}

function setupUser(overrides: any = {}) {
  (useUser as jest.Mock).mockReturnValue({
    user: {
      firstName:      "Alice",
      emailAddresses: [{ emailAddress: "alice@example.com" }],
      ...overrides,
    },
  });
}

// Reset mocks and store state between tests.
beforeEach(() => {
  jest.clearAllMocks();
  setupUser();
  useSubscriptionsStore.getState().resetSubscriptions();
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────

describe("HomeScreen — rendering", () => {
  // The display name must appear in the header so the user sees a personalised greeting.
  it("renders the welcome greeting with the user's first name", () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText("Alice")).toBeTruthy();
  });

  // When firstName is absent the email prefix is used as the fallback display name.
  it("uses the email prefix as the display name when firstName is absent", () => {
    setupUser({ firstName: null });
    const { getByText } = render(<HomeScreen />);
    expect(getByText("alice")).toBeTruthy();
  });

  // Static section labels must always be present on the dashboard.
  it("renders the Monthly stat card label", () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText("Monthly")).toBeTruthy();
  });

  it("renders the Spending Overview section", () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText("Spending Overview")).toBeTruthy();
  });

  it("renders the Due Soon section", () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText("Due Soon")).toBeTruthy();
  });
});

describe("HomeScreen — empty state", () => {
  // When the store has no subscriptions both empty-state messages must be visible.
  it("shows the empty spending-breakdown message", () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText("Add payments to see your spending breakdown.")).toBeTruthy();
  });

  it("shows 'No upcoming payments.' when the due-soon list is empty", () => {
    const { getByText } = render(<HomeScreen />);
    expect(getByText("No upcoming payments.")).toBeTruthy();
  });
});

describe("HomeScreen — with subscriptions", () => {
  // A subscription with a far-future renewal date must appear in the Due Soon list.
  it("renders the subscription name in the Due Soon list", () => {
    useSubscriptionsStore.getState().setSubscriptions([
      makeSub("a", { name: "Netflix" }),
    ]);
    const { getByText } = render(<HomeScreen />);
    expect(getByText("Netflix")).toBeTruthy();
  });
});
