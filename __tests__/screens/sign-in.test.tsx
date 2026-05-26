// Tests for app/(auth)/sign-in.tsx
// Date tested: 2026-05-25
//
// Mocks:
//   @clerk/expo              — useSignIn provides sign-in methods and auth state;
//                              no real Clerk network calls are made.
//   @expo/vector-icons       — Ionicons requires native font assets unavailable
//                              in the Node.js test environment.
//   expo-router              — Link wraps the Sign Up Pressable with router context
//                              that does not exist in tests; replaced with a pass-through.
//   @/utils/biometrics       — all biometric helpers are mocked so tests control
//                              whether the biometric button shows without touching
//                              SecureStore or device hardware.
//   @/components/SortedLogo  — renders react-native-svg which has no JS fallback;
//                              replaced with a null stub.

jest.mock("@clerk/expo", () => ({
  useSignIn: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
}));

jest.mock("@/utils/biometrics", () => ({
  isBiometricsEnabled:        jest.fn(),
  isBiometricsSupported:      jest.fn(),
  getStoredCredentials:       jest.fn(),
  saveCredentials:            jest.fn(),
  setBiometricsEnabled:       jest.fn(),
  authenticateWithBiometrics: jest.fn(),
}));

jest.mock("@/components/SortedLogo", () => () => null);

import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSignIn } from "@clerk/expo";
import * as biometrics from "@/utils/biometrics";
import SignIn from "@/app/(auth)/sign-in";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Builds a minimal Clerk signIn object with all methods pre-mocked to succeed.
// Pass overrides to make individual methods return errors or different statuses.
function makeMockSignIn(overrides: any = {}) {
  return {
    password: jest.fn().mockResolvedValue({ error: null }),
    finalize: jest.fn().mockResolvedValue({ error: null }),
    status:   "idle",
    mfa: {
      sendEmailCode:   jest.fn().mockResolvedValue({ error: null }),
      verifyEmailCode: jest.fn().mockResolvedValue({ error: null }),
    },
    reset:  jest.fn().mockResolvedValue({ error: null }),
    create: jest.fn().mockResolvedValue({}),
    ...overrides,
  };
}

// Configures the useSignIn hook mock with the given signIn object.
function setupClerk(signInOverrides: any = {}) {
  const mockSignIn = makeMockSignIn(signInOverrides);
  (useSignIn as jest.Mock).mockReturnValue({
    signIn:      mockSignIn,
    errors:      undefined,
    fetchStatus: "idle",
  });
  return mockSignIn;
}

// Reset all mock state between tests.
beforeEach(() => {
  jest.clearAllMocks();
  // Default: biometrics disabled so the biometric button is hidden.
  setupClerk();
  (biometrics.isBiometricsEnabled as jest.Mock).mockResolvedValue(false);
});

// ─── SignIn screen ────────────────────────────────────────────────────────────

describe("SignIn screen — rendering", () => {
  // The email input must be present so the user can type their address.
  it("renders the email input field", () => {
    const { getByPlaceholderText } = render(<SignIn />);
    expect(getByPlaceholderText("john.doe@example.com")).toBeTruthy();
  });

  // The password input must be present so the user can type their password.
  it("renders the password input field", () => {
    const { getByPlaceholderText } = render(<SignIn />);
    expect(getByPlaceholderText("••••••••••")).toBeTruthy();
  });

  // The Sign In button must be visible on load so the user can submit.
  it("renders the Sign In button", () => {
    const { getByText } = render(<SignIn />);
    expect(getByText("Sign In")).toBeTruthy();
  });

  // A link to sign-up must be present for users who do not yet have an account.
  it("renders the Sign Up link", () => {
    const { getByText } = render(<SignIn />);
    expect(getByText("Sign Up")).toBeTruthy();
  });
});

describe("SignIn screen — form validation", () => {
  // When neither field is filled the Sign In button is disabled; pressing it
  // must not trigger any Clerk API call.
  it("does not call signIn.password when fields are empty", () => {
    const mockSignIn = setupClerk();
    const { getByText } = render(<SignIn />);
    fireEvent.press(getByText("Sign In"));
    expect(mockSignIn.password).not.toHaveBeenCalled();
  });

  // An email without "@" is not valid — the button remains disabled.
  it("does not call signIn.password for an email missing the @ symbol", () => {
    const mockSignIn = setupClerk();
    const { getByText, getByPlaceholderText } = render(<SignIn />);
    fireEvent.changeText(getByPlaceholderText("john.doe@example.com"), "notanemail");
    fireEvent.changeText(getByPlaceholderText("••••••••••"), "password123");
    fireEvent.press(getByText("Sign In"));
    expect(mockSignIn.password).not.toHaveBeenCalled();
  });

  // When a valid email and a non-empty password are entered the button becomes
  // active and pressing it must call signIn.password with the correct arguments.
  it("calls signIn.password with email and password when the form is valid", async () => {
    const mockSignIn = setupClerk();
    const { getByText, getByPlaceholderText } = render(<SignIn />);
    fireEvent.changeText(getByPlaceholderText("john.doe@example.com"), "user@example.com");
    fireEvent.changeText(getByPlaceholderText("••••••••••"), "password123");
    fireEvent.press(getByText("Sign In"));
    await waitFor(() => {
      expect(mockSignIn.password).toHaveBeenCalledWith({
        emailAddress: "user@example.com",
        password:     "password123",
      });
    });
  });
});

describe("SignIn screen — error handling", () => {
  // When Clerk returns an error the message must appear on screen so the
  // user knows why the sign-in attempt failed.
  it("shows an error message when sign-in fails", async () => {
    setupClerk({
      password: jest.fn().mockResolvedValue({
        error: { longMessage: "Invalid email or password." },
      }),
    });
    const { getByText, getByPlaceholderText } = render(<SignIn />);
    fireEvent.changeText(getByPlaceholderText("john.doe@example.com"), "user@example.com");
    fireEvent.changeText(getByPlaceholderText("••••••••••"), "wrongpass");
    fireEvent.press(getByText("Sign In"));
    await waitFor(() => {
      expect(getByText("Invalid email or password.")).toBeTruthy();
    });
  });
});

describe("SignIn screen — biometric button", () => {
  // On first install (or when the user has never enabled biometrics) the
  // biometric button must not appear.
  it("does not show the biometric button when biometrics are disabled", () => {
    const { queryByText } = render(<SignIn />);
    expect(queryByText("Sign in with Biometrics")).toBeNull();
  });

  // When the user has previously enabled biometrics, credentials are stored,
  // and the device hardware supports biometrics, the button must appear so the
  // user can skip typing their password.
  it("shows the biometric button when biometrics are fully enabled", async () => {
    (biometrics.isBiometricsEnabled as jest.Mock).mockResolvedValue(true);
    (biometrics.getStoredCredentials as jest.Mock).mockResolvedValue({
      email:    "user@example.com",
      password: "stored-pass",
    });
    (biometrics.isBiometricsSupported as jest.Mock).mockResolvedValue(true);
    const { getByText } = render(<SignIn />);
    await waitFor(() => {
      expect(getByText("Sign in with Biometrics")).toBeTruthy();
    });
  });

  // If credentials exist but hardware is not available the button must stay
  // hidden — there is nothing to authenticate against.
  it("does not show the biometric button when hardware is not supported", async () => {
    (biometrics.isBiometricsEnabled as jest.Mock).mockResolvedValue(true);
    (biometrics.getStoredCredentials as jest.Mock).mockResolvedValue({
      email:    "user@example.com",
      password: "stored-pass",
    });
    (biometrics.isBiometricsSupported as jest.Mock).mockResolvedValue(false);
    const { queryByText } = render(<SignIn />);
    await waitFor(() => {
      expect(queryByText("Sign in with Biometrics")).toBeNull();
    });
  });
});
