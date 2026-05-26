import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_ENABLED  = "sorted_bio_enabled";
const KEY_EMAIL    = "sorted_bio_email";
const KEY_PASSWORD = "sorted_bio_password";

/**
 * Determine whether the device supports biometrics and has at least one biometric enrolled.
 *
 * @returns `true` if the device has compatible biometric hardware and at least one enrolled biometric, `false` otherwise.
 */

export async function isBiometricsSupported(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  return LocalAuthentication.isEnrolledAsync();
}

/**
 * Determine whether biometric sign-in is enabled in secure storage.
 *
 * @returns `true` if the stored biometrics preference equals `"true"`, `false` otherwise.
 */

export async function isBiometricsEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(KEY_ENABLED);
  return val === "true";
}

/**
 * Enable or disable biometric sign-in for the device and update secure storage accordingly.
 *
 * When `enabled` is `true`, a persistent flag is written to secure storage indicating biometrics are enabled.
 * When `enabled` is `false`, the flag and any stored email/password credentials are removed from secure storage.
 *
 * @param enabled - Whether biometric sign-in should be enabled
 */
export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(KEY_ENABLED, "true");
  } else {
    await SecureStore.deleteItemAsync(KEY_ENABLED);
    await SecureStore.deleteItemAsync(KEY_EMAIL);
    await SecureStore.deleteItemAsync(KEY_PASSWORD);
  }
}

/**
 * Persist the user's email and password in secure device storage for biometric sign-in.
 *
 * @param email - The user's email address to store
 * @param password - The user's password to store
 */

export async function saveCredentials(email: string, password: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_EMAIL, email);
  await SecureStore.setItemAsync(KEY_PASSWORD, password);
}

/**
 * Retrieve the stored email and password from secure device storage.
 *
 * @returns `{ email: string; password: string }` containing the stored credentials, or `null` if either the email or password is missing
 */
export async function getStoredCredentials(): Promise<{ email: string; password: string } | null> {
  const email    = await SecureStore.getItemAsync(KEY_EMAIL);
  const password = await SecureStore.getItemAsync(KEY_PASSWORD);
  if (!email || !password) return null;
  return { email, password };
}

/**
 * Retrieve the stored email used for biometric sign-in.
 *
 * @returns The stored email string, or `null` if no email is saved
 */
export async function getStoredEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_EMAIL);
}

/**
 * Prompt the user for biometric authentication using a custom message.
 *
 * @param promptMessage - Text displayed in the system biometric prompt
 * @returns `true` if authentication succeeded, `false` otherwise
 */

export async function authenticateWithBiometrics(promptMessage = "Sign in to Sorted"): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Use password",
    disableDeviceFallback: false,
  });
  return result.success;
}
