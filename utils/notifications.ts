import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Configures the foreground notification handler (show banner + sound).
 * Call once at app startup.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Sets up the Android notification channel required for Expo Notifications.
 * No-op on iOS.
 */
export async function setupAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("payment-reminders", {
    name: "Payment Reminders",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * Requests push notification permissions.
 * Returns true if granted, false otherwise.
 */
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Returns the Expo push token string, or null if permissions were denied
 * or the device does not support push notifications.
 *
 * Requires an EAS project ID — set EXPO_PUBLIC_EAS_PROJECT_ID in .env.
 */
export async function getExpoPushToken(): Promise<string | null> {
  // Push tokens are not supported in Expo Go on Android (SDK 53+).
  // A development build is required on Android for remote notifications.
  const granted = await requestPermissions();
  if (!granted) return null;

  try {
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return token.data;
  } catch {
    return null;
  }
}
