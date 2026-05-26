import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

// ─── Storage keys ─────────────────────────────────────────────────────────────

const KEY_ENABLED  = "sorted_bio_enabled";
const KEY_EMAIL    = "sorted_bio_email";
const KEY_PASSWORD = "sorted_bio_password";

// ─── Device support ───────────────────────────────────────────────────────────

export async function isBiometricsSupported(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  return LocalAuthentication.isEnrolledAsync();
}

// ─── Preference ───────────────────────────────────────────────────────────────

export async function isBiometricsEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(KEY_ENABLED);
  return val === "true";
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(KEY_ENABLED, "true");
  } else {
    await SecureStore.deleteItemAsync(KEY_ENABLED);
    await SecureStore.deleteItemAsync(KEY_EMAIL);
    await SecureStore.deleteItemAsync(KEY_PASSWORD);
  }
}

// ─── Credential storage ───────────────────────────────────────────────────────

export async function saveCredentials(email: string, password: string): Promise<void> {
  await SecureStore.setItemAsync(KEY_EMAIL, email);
  await SecureStore.setItemAsync(KEY_PASSWORD, password);
}

export async function getStoredCredentials(): Promise<{ email: string; password: string } | null> {
  const email    = await SecureStore.getItemAsync(KEY_EMAIL);
  const password = await SecureStore.getItemAsync(KEY_PASSWORD);
  if (!email || !password) return null;
  return { email, password };
}

export async function getStoredEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY_EMAIL);
}

// ─── Authentication ───────────────────────────────────────────────────────────

export async function authenticateWithBiometrics(promptMessage = "Sign in to Sorted"): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Use password",
    disableDeviceFallback: false,
  });
  return result.success;
}
