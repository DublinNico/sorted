// Tests for components/ListHeading.tsx
// Date tested: 2026-05-25
// No external mocks required — ListHeading has no native or third-party dependencies.

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import ListHeading from "@/components/ListHeading";

// ─── ListHeading ──────────────────────────────────────────────────────────────

describe("ListHeading", () => {
  // The title prop must appear as visible text on screen so the user
  // knows which list section they are looking at.
  it("renders the title text", () => {
    const { getByText } = render(<ListHeading title="My Subscriptions" />);
    expect(getByText("My Subscriptions")).toBeTruthy();
  });

  // The "View all" button should be present whenever the component renders
  // so the user can navigate to the full list.
  it("renders the View all button", () => {
    const { getByText } = render(
      <ListHeading title="Test" onViewAll={jest.fn()} />
    );
    expect(getByText("View all")).toBeTruthy();
  });

  // Pressing "View all" must fire the onViewAll callback exactly once
  // so the parent screen can navigate to the full list.
  it("calls onViewAll when the View all button is pressed", () => {
    const onViewAll = jest.fn();
    const { getByText } = render(
      <ListHeading title="Test" onViewAll={onViewAll} />
    );
    fireEvent.press(getByText("View all"));
    expect(onViewAll).toHaveBeenCalledTimes(1);
  });
});
