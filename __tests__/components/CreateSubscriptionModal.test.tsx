// Tests for components/CreateSubscriptionModal.tsx
// Date tested: 2026-05-25
//
// Mocks:
//   posthog-react-native  — usePostHog() is called on every render; no real
//                           analytics must be sent from tests.
//   @expo/vector-icons    — Ionicons requires a native font asset not available
//                           in the Node.js test environment.
//   @/components/CalendarPicker — replaced with a no-op stub so this file does
//                           not pull in CalendarPicker's own Ionicons dependency.

jest.mock("posthog-react-native", () => ({
  usePostHog: () => ({ capture: jest.fn() }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("@/components/CalendarPicker", () => () => null);

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";

// Shared props for every test — modal is open with no initial data.
const baseProps = {
  visible:  true,
  onClose:  jest.fn(),
  onSubmit: jest.fn(),
};

// Reset mock call counts before each test so they don't bleed across.
beforeEach(() => {
  jest.clearAllMocks();
});

// ─── CreateSubscriptionModal ──────────────────────────────────────────────────

describe("CreateSubscriptionModal", () => {
  // The modal title must read "New Payment" when no initialData is provided
  // so the user knows they are creating a new entry, not editing one.
  it("renders the New Payment title", () => {
    const { getByText } = render(<CreateSubscriptionModal {...baseProps} />);
    expect(getByText("New Payment")).toBeTruthy();
  });

  // When the form fields are blank the submit button is disabled and
  // handleSubmit returns early, so onSubmit must never be called.
  it("does not call onSubmit when name and price are empty", () => {
    const onSubmit = jest.fn();
    const { getByText } = render(
      <CreateSubscriptionModal {...baseProps} onSubmit={onSubmit} />
    );
    fireEvent.press(getByText("Add Payment"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // Once the user fills in both the name and a positive price the form
  // becomes valid and pressing submit must call onSubmit exactly once.
  it("calls onSubmit once when name and price are both filled", () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <CreateSubscriptionModal {...baseProps} onSubmit={onSubmit} />
    );
    fireEvent.changeText(
      getByPlaceholderText("e.g., Spotify, Electricity, Rent"),
      "Netflix"
    );
    fireEvent.changeText(getByPlaceholderText("9.99"), "9.99");
    fireEvent.press(getByText("Add Payment"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  // The onSubmit payload must include the name and price the user entered
  // so the parent screen can persist the correct data to Supabase.
  it("passes name and price in the onSubmit payload", () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <CreateSubscriptionModal {...baseProps} onSubmit={onSubmit} />
    );
    fireEvent.changeText(
      getByPlaceholderText("e.g., Spotify, Electricity, Rent"),
      "Spotify"
    );
    fireEvent.changeText(getByPlaceholderText("9.99"), "12.99");
    fireEvent.press(getByText("Add Payment"));
    const payload: Subscription = onSubmit.mock.calls[0][0];
    expect(payload.name).toBe("Spotify");
    expect(payload.price).toBe(12.99);
  });

  // Selecting a payment type from the dropdown must auto-assign the matching
  // category so the subscription is filed correctly without manual input.
  it("derives the correct category from the selected payment type", () => {
    const onSubmit = jest.fn();
    const { getByText, getByPlaceholderText } = render(
      <CreateSubscriptionModal {...baseProps} onSubmit={onSubmit} />
    );
    // Open the payment type dropdown (default shows "Rent / Housing").
    fireEvent.press(getByText("Rent / Housing"));
    // Select "Subscription - Entertainment" — maps to category "Entertainment".
    fireEvent.press(getByText("Subscription - Entertainment"));
    // Fill required fields.
    fireEvent.changeText(
      getByPlaceholderText("e.g., Spotify, Electricity, Rent"),
      "Netflix"
    );
    fireEvent.changeText(getByPlaceholderText("9.99"), "9.99");
    fireEvent.press(getByText("Add Payment"));
    expect(onSubmit.mock.calls[0][0].category).toBe("Entertainment");
  });

  // Tapping the ✕ close button must call onClose so the parent screen
  // can hide the modal.
  it("calls onClose when the close button is pressed", () => {
    const onClose = jest.fn();
    const { getByText } = render(
      <CreateSubscriptionModal {...baseProps} onClose={onClose} />
    );
    fireEvent.press(getByText("✕"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // When initialData is provided the modal title must read "Edit Payment"
  // so the user knows they are modifying an existing entry.
  it("renders Edit Payment title when initialData is provided", () => {
    const initialData: Subscription = {
      id:        "sub-1",
      name:      "Netflix",
      price:     9.99,
      billing:   "Monthly",
      icon:      { uri: "https://example.com/icon.png" },
      category:  "Entertainment",
      renewalDate: "2026-06-01T00:00:00.000Z",
    };
    const { getByText } = render(
      <CreateSubscriptionModal {...baseProps} initialData={initialData} />
    );
    expect(getByText("Edit Payment")).toBeTruthy();
  });

  // The logo preview must not be visible when the name field is empty so the
  // UI does not make a pointless network request on first render.
  it("does not show logo preview when name is empty", () => {
    const { queryByTestId } = render(<CreateSubscriptionModal {...baseProps} />);
    expect(queryByTestId("logo-preview")).toBeNull();
  });

  // As soon as the user types a name the logo preview container must appear
  // so they get immediate visual feedback before submitting the form.
  it("shows logo preview when name is typed", () => {
    const { getByTestId, getByPlaceholderText } = render(
      <CreateSubscriptionModal {...baseProps} />
    );
    fireEvent.changeText(
      getByPlaceholderText("e.g., Spotify, Electricity, Rent"),
      "Netflix"
    );
    expect(getByTestId("logo-preview")).toBeTruthy();
  });
});
