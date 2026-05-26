// Tests for app/(tabs)/insights.tsx  (InsightsScreen)
// Date tested: 2026-05-25
//
// Mocks:
//   @expo/vector-icons       — Ionicons requires native font assets unavailable
//                              in the Node.js test environment.
//   expo-router              — useFocusEffect is replaced with a stub that fires
//                              the callback synchronously so bar-chart and donut
//                              animations run during render without a real focus event.
//   react-native-svg         — Svg / Path require a native SVG renderer;
//                              replaced with passthrough / null stubs.
//   react-native-safe-area-context — SafeAreaView requires native context;
//                              replaced with a passthrough View.

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

// useFocusEffect is mocked as a no-op so that animation timers
// (Animated.timing / Animated.spring) are never started and cannot
// fire after the test environment has been torn down.
jest.mock("expo-router", () => ({
  useFocusEffect: () => {},
}));

// insights.tsx uses `import Svg, { Path }` — default + named.
// Without __esModule: true Babel's interop wraps the whole module as the
// default, making Svg a plain object instead of a component.
jest.mock("react-native-svg", () => {
  const React = require("react");
  const SvgComponent = ({ children }: any) => React.createElement(React.Fragment, null, children);
  return {
    __esModule: true,
    default:    SvgComponent,
    Path:       () => null,
  };
});

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

import React from "react";
import { render } from "@testing-library/react-native";
import InsightsScreen from "@/app/(tabs)/insights";
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

// Reset store state between tests.
beforeEach(() => {
  jest.clearAllMocks();
  useSubscriptionsStore.getState().resetSubscriptions();
});

// ─── InsightsScreen ───────────────────────────────────────────────────────────

describe("InsightsScreen — rendering", () => {
  // Static labels must always be present regardless of store state.
  it("renders the Insights title", () => {
    const { getByText } = render(<InsightsScreen />);
    expect(getByText("Insights")).toBeTruthy();
  });

  it("renders the Total Monthly Spending label", () => {
    const { getByText } = render(<InsightsScreen />);
    expect(getByText("Total Monthly Spending")).toBeTruthy();
  });

  it("renders the Spending Trend section", () => {
    const { getByText } = render(<InsightsScreen />);
    expect(getByText("Spending Trend")).toBeTruthy();
  });

  it("renders the Category Breakdown section", () => {
    const { getByText } = render(<InsightsScreen />);
    expect(getByText("Category Breakdown")).toBeTruthy();
  });
});

describe("InsightsScreen — empty state", () => {
  // When there are no subscriptions the breakdown must show its empty-state message.
  it("shows the empty-state message when there are no subscriptions", () => {
    const { getByText } = render(<InsightsScreen />);
    expect(getByText("Add subscriptions to see a breakdown.")).toBeTruthy();
  });
});

describe("InsightsScreen — with subscriptions", () => {
  // With subscriptions the legend must include the category name so the user can
  // read which category contributes what share of their spending.
  it("renders the category name in the breakdown legend", () => {
    useSubscriptionsStore.getState().setSubscriptions([
      makeSub("a", { category: "Entertainment", price: 9.99 }),
      makeSub("b", { category: "Entertainment", price: 4.99 }),
    ]);
    const { getAllByText } = render(<InsightsScreen />);
    expect(getAllByText("Entertainment").length).toBeGreaterThanOrEqual(1);
  });
});
