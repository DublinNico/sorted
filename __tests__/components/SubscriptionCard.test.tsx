// Tests for components/SubscriptionCard.tsx
// Date tested: 2026-05-25
// @expo/vector-icons is mocked because Ionicons requires a native font asset
// that is not available in the Node.js test environment.

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import SubscriptionCard from "@/components/SubscriptionCard";

// Minimal set of props that satisfies SubscriptionCardProps for a collapsed card.
const baseProps: SubscriptionCardProps = {
  name:          "Netflix",
  price:         9.99,
  currency:      "EUR",
  icon:          { uri: "https://example.com/icon.png" },
  billing:       "Monthly",
  color:         "#ffd6a5",
  category:      "Entertainment",
  renewalDate:   "2026-06-01T00:00:00.000Z",
  expanded:      false,
  onPress:       jest.fn(),
  onCancelPress: jest.fn(),
  onEditPress:   jest.fn(),
};

// Reset all mocks between tests so call counts don't bleed across.
beforeEach(() => {
  jest.clearAllMocks();
});

// ─── SubscriptionCard ─────────────────────────────────────────────────────────

describe("SubscriptionCard — collapsed state", () => {
  // The service name is the most prominent label — it must always be visible
  // regardless of whether the card is expanded or collapsed.
  it("renders the subscription name", () => {
    const { getByText } = render(<SubscriptionCard {...baseProps} />);
    expect(getByText("Netflix")).toBeTruthy();
  });

  // The formatted price must be visible in the collapsed state so the user
  // can see the cost without expanding the card.
  it("renders the formatted price", () => {
    const { getByText } = render(<SubscriptionCard {...baseProps} />);
    expect(getByText(/9[.,]99/)).toBeTruthy();
  });

  // The billing cycle label (Weekly / Monthly / Yearly) tells the user
  // the payment frequency at a glance.
  it("renders the billing cycle", () => {
    const { getByText } = render(<SubscriptionCard {...baseProps} />);
    expect(getByText("Monthly")).toBeTruthy();
  });

  // Tapping anywhere on the card must call onPress so the parent screen
  // can toggle the expanded state.
  it("calls onPress when the card is tapped", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SubscriptionCard {...baseProps} onPress={onPress} />
    );
    // Press the name text — the event bubbles up to the wrapping Pressable.
    fireEvent.press(getByText("Netflix"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  // The delete button must NOT appear when the card is collapsed — showing it
  // unconditionally would clutter the list and invite accidental taps.
  it("does not render the delete button when collapsed", () => {
    const { queryByText } = render(
      <SubscriptionCard {...baseProps} expanded={false} />
    );
    expect(queryByText("Delete Subscription")).toBeNull();
  });
});

describe("SubscriptionCard — expanded state", () => {
  // The delete button must appear only after the user taps to expand the card,
  // confirming they want to take an action on this specific subscription.
  it("renders the delete button when expanded", () => {
    const { getByText } = render(
      <SubscriptionCard {...baseProps} expanded={true} />
    );
    expect(getByText("Delete Subscription")).toBeTruthy();
  });

  // Pressing delete must call onCancelPress so the parent screen can remove
  // the subscription from the store and from Supabase.
  it("calls onCancelPress when the delete button is pressed", () => {
    const onCancelPress = jest.fn();
    const { getByText } = render(
      <SubscriptionCard {...baseProps} expanded={true} onCancelPress={onCancelPress} />
    );
    fireEvent.press(getByText("Delete Subscription"));
    expect(onCancelPress).toHaveBeenCalledTimes(1);
  });

  // The edit button must appear when expanded so the user can open the
  // edit modal to change the subscription details.
  it("renders the edit button when expanded", () => {
    const { getByText } = render(
      <SubscriptionCard {...baseProps} expanded={true} />
    );
    expect(getByText("Edit Payment")).toBeTruthy();
  });

  // Pressing edit must call onEditPress so the parent screen can open
  // the CreateSubscriptionModal in edit mode.
  it("calls onEditPress when the edit button is pressed", () => {
    const onEditPress = jest.fn();
    const { getByText } = render(
      <SubscriptionCard {...baseProps} expanded={true} onEditPress={onEditPress} />
    );
    fireEvent.press(getByText("Edit Payment"));
    expect(onEditPress).toHaveBeenCalledTimes(1);
  });
});

describe("SubscriptionCard — One-off billing", () => {
  const oneOffBase: SubscriptionCardProps = {
    ...baseProps,
    billing: "One-off",
    status:  "unpaid",
    onMarkPaid: jest.fn(),
  };

  // One-off unpaid bills must show an "Unpaid" badge instead of a billing
  // frequency string so the user can immediately see outstanding bills.
  it("renders Unpaid badge for an unpaid one-off bill", () => {
    const { getByText } = render(<SubscriptionCard {...oneOffBase} />);
    expect(getByText("Unpaid")).toBeTruthy();
  });

  // Once a one-off bill is paid the badge must switch to "Paid" so the
  // user knows the obligation has been settled.
  it("renders Paid badge for a paid one-off bill", () => {
    const { getByText } = render(
      <SubscriptionCard {...oneOffBase} status="paid" />
    );
    expect(getByText("Paid")).toBeTruthy();
  });

  // The billing frequency string (e.g. "Monthly") must not appear for one-off
  // bills — the badge replaces it.
  it("does not render the billing frequency text for one-off bills", () => {
    const { queryByText } = render(<SubscriptionCard {...oneOffBase} />);
    expect(queryByText("One-off")).toBeNull();
  });

  // The Mark as Paid button must only appear for unpaid one-off bills in the
  // expanded state so the user can settle them from the list.
  it("renders Mark as Paid button when expanded and unpaid", () => {
    const { getByText } = render(
      <SubscriptionCard {...oneOffBase} expanded={true} />
    );
    expect(getByText("Mark as Paid")).toBeTruthy();
  });

  // Pressing Mark as Paid must call onMarkPaid so the parent screen can
  // update the status in the store and persist it to Supabase.
  it("calls onMarkPaid when Mark as Paid is pressed", () => {
    const onMarkPaid = jest.fn();
    const { getByText } = render(
      <SubscriptionCard {...oneOffBase} expanded={true} onMarkPaid={onMarkPaid} />
    );
    fireEvent.press(getByText("Mark as Paid"));
    expect(onMarkPaid).toHaveBeenCalledTimes(1);
  });

  // Mark as Paid must NOT appear for already-paid one-off bills — the action
  // is irreversible so there is nothing to do once settled.
  it("does not render Mark as Paid when bill is already paid", () => {
    const { queryByText } = render(
      <SubscriptionCard {...oneOffBase} expanded={true} status="paid" />
    );
    expect(queryByText("Mark as Paid")).toBeNull();
  });
});
