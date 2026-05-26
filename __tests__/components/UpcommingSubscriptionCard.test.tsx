// Tests for components/UpcommingSubscriptionCard.tsx
// Date tested: 2026-05-25
// No external mocks required — the component only uses React Native core
// primitives and the pure formatCurrency utility.

import React from "react";
import { render } from "@testing-library/react-native";
import UpcommingSubscriptionCard from "@/components/UpcommingSubscriptionCard";

// Minimal props that satisfy all required fields.
const baseProps: UpcomingSubscriptionCardProps = {
  name:     "Netflix",
  price:    9.99,
  currency: "EUR",
  icon:     { uri: "https://example.com/icon.png" },
  daysLeft: 5,
};

// ─── UpcommingSubscriptionCard ────────────────────────────────────────────────

describe("UpcommingSubscriptionCard", () => {
  // The service name is the primary label on the card — it must always
  // be visible so the user can identify which subscription is renewing.
  it("renders the subscription name", () => {
    const { getByText } = render(<UpcommingSubscriptionCard {...baseProps} />);
    expect(getByText("Netflix")).toBeTruthy();
  });

  // The formatted price is displayed using formatCurrency — the output
  // contains the numeric value regardless of exact locale symbol placement.
  it("renders the formatted price", () => {
    const { getByText } = render(<UpcommingSubscriptionCard {...baseProps} />);
    // Match the numeric portion regardless of locale symbol position.
    expect(getByText(/9[.,]99/)).toBeTruthy();
  });

  // When there are multiple days remaining the countdown text must show
  // the exact number so the user knows how urgent the renewal is.
  it('shows "{n} days left" when daysLeft is greater than 1', () => {
    const { getByText } = render(
      <UpcommingSubscriptionCard {...baseProps} daysLeft={5} />
    );
    expect(getByText(/5 days left/)).toBeTruthy();
  });

  // When only one day remains the card shows "Last day" instead of
  // "1 days left" so the language stays natural for the user.
  it('shows "Last day" when daysLeft is 1', () => {
    const { getByText } = render(
      <UpcommingSubscriptionCard {...baseProps} daysLeft={1} />
    );
    expect(getByText(/Last day/)).toBeTruthy();
  });
});
