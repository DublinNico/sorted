// Tests for app/notifications.tsx
// Date tested: 2026-05-25
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
  getNotificationPrefs:    jest.fn().mockResolvedValue({ enabled: true }),
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
import { render } from "@testing-library/react-native";
import NotificationsScreen from "@/app/notifications";

// Reset call counts between tests.
beforeEach(() => {
  jest.clearAllMocks();
});

// ─── NotificationsScreen ──────────────────────────────────────────────────────

describe("NotificationsScreen — rendering", () => {
  // The screen title must be visible so the user knows where they are.
  it("renders the Notifications title", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("Notifications")).toBeTruthy();
  });

  // Section headers group the settings rows for readability.
  it("renders the CHANNELS section header", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("CHANNELS")).toBeTruthy();
  });

  it("renders the WHAT TO NOTIFY section header", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("WHAT TO NOTIFY")).toBeTruthy();
  });

  // Each of the six setting rows must render with its title so the user
  // can identify which toggle controls which notification type.
  it("renders the Push Notifications row", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("Push Notifications")).toBeTruthy();
  });

  it("renders the Email row", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("Email")).toBeTruthy();
  });

  it("renders the SMS row", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("SMS")).toBeTruthy();
  });

  it("renders the Upcoming Payments row", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("Upcoming Payments")).toBeTruthy();
  });

  it("renders the Weekly Summary row", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("Weekly Summary")).toBeTruthy();
  });

  it("renders the Price Changes row", () => {
    const { getByText } = render(<NotificationsScreen />);
    expect(getByText("Price Changes")).toBeTruthy();
  });
});
