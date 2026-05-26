// Tests for all exported functions in utils/biometrics.ts.
// Date tested: 2026-05-25
// Both expo-secure-store and expo-local-authentication are mocked so no
// real device hardware or keychain is touched during the test run.

jest.mock("expo-secure-store", () => ({
  getItemAsync:    jest.fn(),
  setItemAsync:    jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("expo-local-authentication", () => ({
  hasHardwareAsync:   jest.fn(),
  isEnrolledAsync:    jest.fn(),
  authenticateAsync:  jest.fn(),
}));

import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import {
  authenticateWithBiometrics,
  getStoredCredentials,
  getStoredEmail,
  isBiometricsEnabled,
  isBiometricsSupported,
  saveCredentials,
  setBiometricsEnabled,
} from "@/utils/biometrics";

// Clear all mock call history and return values before each test so that
// one test's setup cannot bleed into the next.
beforeEach(() => {
  jest.clearAllMocks();
});

// ─── isBiometricsSupported ────────────────────────────────────────────────────

describe("isBiometricsSupported", () => {
  // If the device has no biometric hardware at all, the function must return
  // false immediately without checking enrolment.
  it("returns false when the device has no biometric hardware", async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
    expect(await isBiometricsSupported()).toBe(false);
  });

  // If hardware is present but no biometrics have been enrolled (e.g. no
  // fingerprints set up), the function must still return false.
  it("returns false when hardware is present but no biometrics are enrolled", async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
    expect(await isBiometricsSupported()).toBe(false);
  });

  // Only when both hardware is available AND biometrics are enrolled should
  // the function return true.
  it("returns true when hardware is present and biometrics are enrolled", async () => {
    (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
    (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
    expect(await isBiometricsSupported()).toBe(true);
  });
});

// ─── isBiometricsEnabled ──────────────────────────────────────────────────────

describe("isBiometricsEnabled", () => {
  // When nothing has been stored yet (first install), SecureStore returns null,
  // so biometrics must be treated as disabled.
  it("returns false when no value is stored", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await isBiometricsEnabled()).toBe(false);
  });

  // Only the exact string "true" should enable biometrics — any other stored
  // value must be treated as disabled.
  it("returns false when the stored value is not 'true'", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("false");
    expect(await isBiometricsEnabled()).toBe(false);
  });

  // When the user has previously enabled biometrics the flag "true" is stored
  // and the function must return true.
  it("returns true when 'true' is stored", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("true");
    expect(await isBiometricsEnabled()).toBe(true);
  });
});

// ─── setBiometricsEnabled ─────────────────────────────────────────────────────

describe("setBiometricsEnabled", () => {
  // Enabling biometrics should write the "true" flag to the KEY_ENABLED key.
  it("writes 'true' to SecureStore when enabling", async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    await setBiometricsEnabled(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("sorted_bio_enabled", "true");
  });

  // Disabling biometrics should delete all three keys — the flag, the stored
  // email, and the stored password — to ensure no credentials remain on device.
  it("deletes all three keys from SecureStore when disabling", async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    await setBiometricsEnabled(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sorted_bio_enabled");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sorted_bio_email");
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sorted_bio_password");
  });

  // When disabling, setItemAsync must never be called — we only delete, never write.
  it("does not write anything to SecureStore when disabling", async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
    await setBiometricsEnabled(false);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });
});

// ─── saveCredentials ──────────────────────────────────────────────────────────

describe("saveCredentials", () => {
  // Both the email and the password must be stored in SecureStore under their
  // respective keys so they can be retrieved for biometric sign-in later.
  it("saves email and password to SecureStore", async () => {
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    await saveCredentials("user@example.com", "secret123");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("sorted_bio_email", "user@example.com");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("sorted_bio_password", "secret123");
  });
});

// ─── getStoredCredentials ─────────────────────────────────────────────────────

describe("getStoredCredentials", () => {
  // If no email is stored the function must return null rather than returning
  // a partial object with an undefined email.
  it("returns null when email is not stored", async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce(null)      // email
      .mockResolvedValueOnce("secret"); // password
    expect(await getStoredCredentials()).toBeNull();
  });

  // If no password is stored the function must return null for the same reason.
  it("returns null when password is not stored", async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce("user@example.com") // email
      .mockResolvedValueOnce(null);              // password
    expect(await getStoredCredentials()).toBeNull();
  });

  // When both values are present the function must return them together as an
  // object so the sign-in flow can use them directly.
  it("returns { email, password } when both are stored", async () => {
    (SecureStore.getItemAsync as jest.Mock)
      .mockResolvedValueOnce("user@example.com")
      .mockResolvedValueOnce("secret123");
    const result = await getStoredCredentials();
    expect(result).toEqual({ email: "user@example.com", password: "secret123" });
  });
});

// ─── getStoredEmail ───────────────────────────────────────────────────────────

describe("getStoredEmail", () => {
  // Returns whatever string is stored under the email key, or null if absent.
  it("returns the stored email string", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("user@example.com");
    expect(await getStoredEmail()).toBe("user@example.com");
  });

  // Returns null when no email has been saved yet.
  it("returns null when no email is stored", async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    expect(await getStoredEmail()).toBeNull();
  });
});

// ─── authenticateWithBiometrics ───────────────────────────────────────────────

describe("authenticateWithBiometrics", () => {
  // When the user successfully verifies their biometrics the native API returns
  // { success: true } and the function must return true.
  it("returns true when authentication succeeds", async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
    expect(await authenticateWithBiometrics()).toBe(true);
  });

  // When the user cancels or fails (wrong finger, face not recognised) the
  // native API returns { success: false } and the function must return false.
  it("returns false when authentication fails or is cancelled", async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: false });
    expect(await authenticateWithBiometrics()).toBe(false);
  });

  // The custom prompt message should be forwarded to the native API so the
  // user sees the correct contextual message on the lock screen.
  it("passes the prompt message to authenticateAsync", async () => {
    (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });
    await authenticateWithBiometrics("Sign in to Sorted");
    expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ promptMessage: "Sign in to Sorted" })
    );
  });
});
