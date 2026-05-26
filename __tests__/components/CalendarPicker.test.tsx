// Tests for components/CalendarPicker.tsx
// Date tested: 2026-05-25
// @expo/vector-icons is mocked because Ionicons requires a native font asset
// not available in the Node.js test environment.

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import dayjs from "dayjs";
import CalendarPicker from "@/components/CalendarPicker";

// ─── CalendarPicker ───────────────────────────────────────────────────────────

describe("CalendarPicker", () => {
  // When visible the header must show the current month and year so
  // the user knows which month they are looking at on first open.
  it("renders the current month and year header when visible", () => {
    const expectedHeader = dayjs().format("MMMM YYYY");
    const { getByText } = render(
      <CalendarPicker
        visible={true}
        value=""
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(getByText(expectedHeader)).toBeTruthy();
  });

  // Pressing "Today" must call onSelect with today's date in dd/mm/yyyy
  // format and also call onClose so the picker dismisses itself.
  it("calls onSelect with today's date and onClose when Today is pressed", () => {
    const onSelect = jest.fn();
    const onClose  = jest.fn();
    const { getByText } = render(
      <CalendarPicker
        visible={true}
        value=""
        onSelect={onSelect}
        onClose={onClose}
      />
    );
    fireEvent.press(getByText("Today"));
    expect(onSelect).toHaveBeenCalledWith(dayjs().format("DD/MM/YYYY"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Pressing "Clear" must call onSelect with an empty string (clearing the
  // date field) and call onClose to dismiss the picker.
  it("calls onSelect with empty string and onClose when Clear is pressed", () => {
    const onSelect = jest.fn();
    const onClose  = jest.fn();
    const { getByText } = render(
      <CalendarPicker
        visible={true}
        value=""
        onSelect={onSelect}
        onClose={onClose}
      />
    );
    fireEvent.press(getByText("Clear"));
    expect(onSelect).toHaveBeenCalledWith("");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Weekday column headers must always be present so the user can orient
  // themselves in the Monday-first grid.
  it("renders the weekday column headers", () => {
    const { getByText } = render(
      <CalendarPicker
        visible={true}
        value=""
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(getByText("Mo")).toBeTruthy();
    expect(getByText("Su")).toBeTruthy();
  });
});
