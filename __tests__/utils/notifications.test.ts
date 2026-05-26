// Tests for requestPermissions() and getExpoPushToken()
// in utils/notifications.ts.
// Date tested: 2026-05-25
// expo-notifications is mocked so no real device permission prompts or
// push token requests are made during the test run.

jest.mock("expo-notifications", () => ({
  setNotificationHandler:      jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getPermissionsAsync:         jest.fn(),
  requestPermissionsAsync:     jest.fn(),
  getExpoPushTokenAsync:       jest.fn(),
  AndroidImportance:           { HIGH: 4 },
}));

import * as Notifications from "expo-notifications";
import {
  configureNotificationHandler,
  getExpoPushToken,
  requestPermissions,
  setupAndroidChannel,
} from "@/utils/notifications";

// Clear mock state before every test.
beforeEach(() => {
  jest.clearAllMocks();
});

// ─── configureNotificationHandler ────────────────────────────────────────────

describe("configureNotificationHandler", () => {
  // The function must register a notification handler with the Expo SDK exactly
  // once on startup so foreground notifications show as banners with sound.
  it("calls setNotificationHandler once", () => {
    configureNotificationHandler();
    expect(Notifications.setNotificationHandler).toHaveBeenCalledTimes(1);
  });

  // The handler must be an object with a handleNotification function so the
  // Expo SDK can call it when a notification arrives in the foreground.
  it("passes an object with a handleNotification function", () => {
    configureNotificationHandler();
    const arg = (Notifications.setNotificationHandler as jest.Mock).mock.calls[0][0];
    expect(typeof arg.handleNotification).toBe("function");
  });
});

// ─── setupAndroidChannel ──────────────────────────────────────────────────────

describe("setupAndroidChannel", () => {
  // On iOS (the default jest-expo environment) this function is a no-op —
  // it must return without calling setNotificationChannelAsync.
  it("does not create a channel on iOS", async () => {
    await setupAndroidChannel();
    expect(Notifications.setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});

// ─── requestPermissions ───────────────────────────────────────────────────────

describe("requestPermissions", () => {
  // If the user has already granted permission in a previous session, the
  // function must return true immediately without prompting again.
  it("returns true without requesting when permission is already granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    expect(await requestPermissions()).toBe(true);
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  // If permission has not been granted yet, the function must prompt the user
  // and return true when they accept.
  it("returns true when the user grants permission on the prompt", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    expect(await requestPermissions()).toBe(true);
  });

  // If the user denies the permission prompt the function must return false
  // so the caller can skip push notification setup.
  it("returns false when the user denies the prompt", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    expect(await requestPermissions()).toBe(false);
  });
});

// ─── getExpoPushToken ─────────────────────────────────────────────────────────

describe("getExpoPushToken", () => {
  // If permissions are denied the function must return null immediately —
  // there is no point requesting a token without notification permission.
  it("returns null when permissions are denied", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "undetermined" });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    expect(await getExpoPushToken()).toBeNull();
  });

  // When permissions are granted the function must return the token string
  // from the Expo push token API.
  it("returns the push token string when permissions are granted", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
      data: "ExponentPushToken[test-token]",
    });
    expect(await getExpoPushToken()).toBe("ExponentPushToken[test-token]");
  });

  // If getExpoPushTokenAsync throws (e.g. no EAS project ID, unsupported device),
  // the function must catch the error and return null rather than crashing the app.
  it("returns null when getExpoPushTokenAsync throws", async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
    (Notifications.getExpoPushTokenAsync as jest.Mock).mockRejectedValue(
      new Error("Not supported in Expo Go")
    );
    expect(await getExpoPushToken()).toBeNull();
  });
});
