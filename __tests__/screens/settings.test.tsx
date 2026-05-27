jest.mock("@clerk/expo", () => ({
  useUser:  () => ({ user: mockUser }),
  useClerk: () => ({ signOut: mockSignOut }),
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.2.3" } },
}));

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import Settings from "@/app/(tabs)/settings";
import { useSubscriptionsStore } from "@/store/subscriptionsStore";

// ─── Shared mutable state ─────────────────────────────────────────────────────

let mockUser: Record<string, unknown> | null = {
  fullName: "Alice Byrne",
  firstName: "Alice",
  lastName: "Byrne",
  emailAddresses: [{ emailAddress: "alice@example.com" }],
};

const mockSignOut = jest.fn();

function makeSub(id: string, price: number): Subscription {
  return {
    id,
    name: `Sub ${id}`,
    price,
    billing: "Monthly",
    icon: { uri: "" },
    category: "Entertainment",
    renewalDate: "2026-06-01T00:00:00.000Z",
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptionsStore.getState().resetSubscriptions();
  mockUser = {
    fullName: "Alice Byrne",
    firstName: "Alice",
    lastName: "Byrne",
    emailAddresses: [{ emailAddress: "alice@example.com" }],
  };
});

// ─── Settings screen — rendering ──────────────────────────────────────────────

describe("Settings screen — rendering", () => {
  it("renders the Settings title", () => {
    const { getByText } = render(<Settings />);
    expect(getByText("Settings")).toBeTruthy();
  });

  it("shows the user's full name", () => {
    const { getByText } = render(<Settings />);
    expect(getByText("Alice Byrne")).toBeTruthy();
  });

  it("shows the user's email", () => {
    const { getByText } = render(<Settings />);
    expect(getByText("alice@example.com")).toBeTruthy();
  });

  it("shows two-letter initials when both names are available", () => {
    const { getByText } = render(<Settings />);
    expect(getByText("AB")).toBeTruthy();
  });

  it("falls back to email initial when no name is set", () => {
    mockUser = { fullName: null, firstName: null, lastName: null, emailAddresses: [{ emailAddress: "zara@example.com" }] };
    const { getByText } = render(<Settings />);
    expect(getByText("Z")).toBeTruthy();
  });

  it("shows '?' initials when user has no name or email", () => {
    mockUser = { fullName: null, firstName: null, lastName: null, emailAddresses: [] };
    const { getByText } = render(<Settings />);
    expect(getByText("?")).toBeTruthy();
  });

  it("renders all settings row labels", () => {
    const { getByText } = render(<Settings />);
    expect(getByText("Notifications")).toBeTruthy();
    expect(getByText("Payment Methods")).toBeTruthy();
    expect(getByText("Security")).toBeTruthy();
    expect(getByText("Help & Support")).toBeTruthy();
  });

  it("renders the Sign Out button", () => {
    const { getByTestId } = render(<Settings />);
    expect(getByTestId("sign-out-button")).toBeTruthy();
  });

  it("renders the app version from expo-constants", () => {
    const { getByText } = render(<Settings />);
    expect(getByText("1.2.3")).toBeTruthy();
  });
});

// ─── Settings screen — store data ─────────────────────────────────────────────

describe("Settings screen — store data", () => {
  it("shows 0 active payments when store is empty", () => {
    const { getAllByText } = render(<Settings />);
    expect(getAllByText("0").length).toBeGreaterThan(0);
  });

  it("shows correct active payment count from the store", () => {
    useSubscriptionsStore.getState().setSubscriptions([makeSub("a", 10), makeSub("b", 20)]);
    const { getByText } = render(<Settings />);
    expect(getByText("2")).toBeTruthy();
  });

  it("shows total monthly cost from the store", () => {
    useSubscriptionsStore.getState().setSubscriptions([makeSub("a", 9.99), makeSub("b", 5.01)]);
    const { getByText } = render(<Settings />);
    expect(getByText("€15.00")).toBeTruthy();
  });
});

// ─── Settings screen — actions ────────────────────────────────────────────────

describe("Settings screen — actions", () => {
  it("calls signOut when the Sign Out button is pressed", () => {
    const { getByTestId } = render(<Settings />);
    fireEvent.press(getByTestId("sign-out-button"));
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
