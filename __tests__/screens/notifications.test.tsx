// Tests for app/notifications.tsx
//
// Mocks:
//   @clerk/expo              — useAuth provides userId without a real Clerk session.
//   @expo/vector-icons       — Ionicons requires native font assets unavailable
//                              in the Node.js test environment.
//   expo-router              — useRouter provides navigation stubs; no real
//                              navigation stack exists in tests.
//   @/hooks/useSupabase      — returns an empty object so no Supabase client
//                              is created and no network calls are made.
//   @/services/notificationPrefs — getNotificationPrefs / upsertNotificationPrefs
//                              are replaced with controlled stubs.
//   @/utils/notifications    — requestPermissions is replaced with a stub that
//                              always grants permission.
//   react-native-safe-area-context — SafeAreaView requires native context;
//                              replaced with a passthrough View.

jest.mock("@clerk/expo", () => ({
  useAuth: () => ({ userId: "user-123" }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), navigate: jest.fn() }),
}));

jest.mock("@/hooks/useSupabase", () => ({
  useSupabase: () => ({}),
}));

jest.mock("@/services/notificationPrefs", () => ({
  getNotificationPrefs:    jest.fn().mockResolvedValue({ enabled: true, daysBefore: [1, 3, 7] }),
  upsertNotificationPrefs: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/utils/notifications", () => ({
  requestPermissions: jest.fn().mockResolvedValue(true),
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import NotificationsScreen from "@/app/notifications";
import {
  getNotificationPrefs,
  upsertNotificationPrefs,
} from "@/services/notificationPrefs";
import { requestPermissions } from "@/utils/notifications";

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe("NotificationsScreen — rendering", () => {
  it("renders the Notifications title", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("Notifications")).toBeTruthy();
  });

  it("renders the PUSH NOTIFICATIONS section header", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("PUSH NOTIFICATIONS")).toBeTruthy();
  });

  it("renders the REMIND ME section header", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("REMIND ME")).toBeTruthy();
  });

  it("renders the Push Notifications row", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("Push Notifications")).toBeTruthy();
  });

  it("renders all three days-before options", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("1 day before")).toBeTruthy();
    expect(getByText("3 days before")).toBeTruthy();
    expect(getByText("7 days before")).toBeTruthy();
  });

  it("does not render removed fake toggles", () => {
    const { queryByText } = render(<NotificationsScreen />);
    expect(queryByText("Email")).toBeNull();
    expect(queryByText("SMS")).toBeNull();
    expect(queryByText("Weekly Summary")).toBeNull();
    expect(queryByText("Price Changes")).toBeNull();
  });
});

// ─── Data loading ─────────────────────────────────────────────────────────────

describe("NotificationsScreen — data loading", () => {
  it("calls getNotificationPrefs on mount", async () => {
    render(<NotificationsScreen />);
    await waitFor(() => {
      expect(getNotificationPrefs).toHaveBeenCalledTimes(1);
      expect(getNotificationPrefs).toHaveBeenCalledWith({}, "user-123");
    });
  });

  it("loads remote prefs — disabled push with custom days", async () => {
    (getNotificationPrefs as jest.Mock).mockResolvedValueOnce({
      enabled: false,
      daysBefore: [3],
    });
    const { getByRole } = render(<NotificationsScreen />);
    await waitFor(() => {
      const toggle = getByRole("switch");
      expect(toggle.props.value).toBe(false);
    });
  });
});

// ─── Push toggle interaction ──────────────────────────────────────────────────

describe("NotificationsScreen — push toggle", () => {
  it("requests OS permission when enabling push", async () => {
    const { getByRole } = render(<NotificationsScreen />);
    const toggle = getByRole("switch");
    // Turn off first so we can turn it back on.
    fireEvent(toggle, "valueChange", false);
    await act(async () => { jest.runAllTimers(); });
    fireEvent(toggle, "valueChange", true);
    await waitFor(() => {
      expect(requestPermissions).toHaveBeenCalled();
    });
  });

  it("saves to Supabase after debounce when push is toggled", async () => {
    const { getByRole } = render(<NotificationsScreen />);
    const toggle = getByRole("switch");
    fireEvent(toggle, "valueChange", false);
    await act(async () => { jest.runAllTimers(); });
    await waitFor(() => {
      expect(upsertNotificationPrefs).toHaveBeenCalledWith(
        {},
        "user-123",
        expect.objectContaining({ enabled: false })
      );
    });
  });

  it("does not save before debounce delay", () => {
    const { getByRole } = render(<NotificationsScreen />);
    const toggle = getByRole("switch");
    fireEvent(toggle, "valueChange", false);
    // Do not advance timers — save should not have fired yet.
    expect(upsertNotificationPrefs).not.toHaveBeenCalled();
  });
});

// ─── Days-before interaction ──────────────────────────────────────────────────

describe("NotificationsScreen — days-before selection", () => {
  it("saves updated daysBefore array when a day is toggled off", async () => {
    const { getByText } = render(<NotificationsScreen />);
    // Deselect "3 days before" (it starts selected per mock).
    fireEvent.press(getByText("3 days before"));
    await act(async () => { jest.runAllTimers(); });
    await waitFor(() => {
      expect(upsertNotificationPrefs).toHaveBeenCalledWith(
        {},
        "user-123",
        expect.objectContaining({ daysBefore: [1, 7] })
      );
    });
  });

  it("saves updated daysBefore array when a day is toggled on", async () => {
    // Start with only day 1 selected.
    (getNotificationPrefs as jest.Mock).mockResolvedValueOnce({
      enabled: true,
      daysBefore: [1],
    });
    const { getByText } = render(<NotificationsScreen />);
    await waitFor(() => {}); // wait for prefs to load
    fireEvent.press(getByText("7 days before"));
    await act(async () => { jest.runAllTimers(); });
    await waitFor(() => {
      expect(upsertNotificationPrefs).toHaveBeenCalledWith(
        {},
        "user-123",
        expect.objectContaining({ daysBefore: [1, 7] })
      );
    });
  });
});
