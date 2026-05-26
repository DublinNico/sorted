// Tests for app/(auth)/sign-up.tsx
// Date tested: 2026-05-25
//
// Mocks:
//   @clerk/expo              — useSignUp provides sign-up methods and auth state;
//                              no real Clerk network calls are made.
//   @expo/vector-icons       — Ionicons requires native font assets unavailable
//                              in the Node.js test environment.
//   expo-router              — Link wraps the Sign In Pressable with router context
//                              that does not exist in tests; replaced with a pass-through.
//   @/components/SortedLogo  — renders react-native-svg which has no JS fallback;
//                              replaced with a null stub.
//   react-native-safe-area-context — SafeAreaView requires native context;
//                              replaced with a passthrough View.

jest.mock("@clerk/expo", () => ({
  useSignUp: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: () => null,
}));

jest.mock("expo-router", () => ({
  Link: ({ children }: any) => children,
}));

jest.mock("@/components/SortedLogo", () => () => null);

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useSignUp } from "@clerk/expo";
import SignUp from "@/app/(auth)/sign-up";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Builds a minimal Clerk signUp object with all methods pre-mocked to succeed.
// Pass overrides to make individual methods return errors or specific states.
function makeMockSignUp(overrides: any = {}) {
  return {
    create: jest.fn().mockResolvedValue({ error: null }),
    verifications: {
      sendEmailCode:   jest.fn().mockResolvedValue({ error: null }),
      verifyEmailCode: jest.fn().mockResolvedValue({ error: null }),
    },
    finalize:         jest.fn().mockResolvedValue({ error: null }),
    status:           "idle",
    unverifiedFields: [],
    missingFields:    [],
    ...overrides,
  };
}

// Configures the useSignUp hook mock with the given signUp object.
function setupClerk(signUpOverrides: any = {}) {
  const mockSignUp = makeMockSignUp(signUpOverrides);
  (useSignUp as jest.Mock).mockReturnValue({
    signUp:      mockSignUp,
    errors:      undefined,
    fetchStatus: "idle",
  });
  return mockSignUp;
}

// Reset all mock state between tests.
beforeEach(() => {
  jest.clearAllMocks();
  setupClerk();
});

// ─── SignUp screen ────────────────────────────────────────────────────────────

describe("SignUp screen — rendering", () => {
  // All four fields must be visible on load so the user can fill in the form.
  it("renders the Full Name input", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    expect(getByPlaceholderText("John Doe")).toBeTruthy();
  });

  it("renders the Email input", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    expect(getByPlaceholderText("john.doe@example.com")).toBeTruthy();
  });

  it("renders the Password input", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    expect(getByPlaceholderText("At least 8 characters")).toBeTruthy();
  });

  it("renders the Confirm Password input", () => {
    const { getByPlaceholderText } = render(<SignUp />);
    expect(getByPlaceholderText("Re-enter your password")).toBeTruthy();
  });

  // The submit button must be present so the user can create their account.
  // "Create Account" also appears as the page heading, so getAllByText is used.
  it("renders the Create Account button", () => {
    const { getAllByText } = render(<SignUp />);
    expect(getAllByText("Create Account").length).toBeGreaterThanOrEqual(1);
  });

  // A link back to sign-in must be present for users who already have an account.
  it("renders the Sign in link", () => {
    const { getByText } = render(<SignUp />);
    expect(getByText("Sign in")).toBeTruthy();
  });
});

// Helper: the "Create Account" label appears on both the page heading and the
// submit button.  pressSubmit() targets the button (last occurrence) so that
// fireEvent.press bubbles up to the Pressable correctly.
function pressSubmit(getAllByText: ReturnType<typeof render>["getAllByText"]) {
  const nodes = getAllByText("Create Account");
  fireEvent.press(nodes[nodes.length - 1]);
}

describe("SignUp screen — form validation", () => {
  // With no input the button is disabled; pressing it must not call Clerk.
  it("does not call signUp.create when all fields are empty", () => {
    const mockSignUp = setupClerk();
    const { getAllByText } = render(<SignUp />);
    pressSubmit(getAllByText);
    expect(mockSignUp.create).not.toHaveBeenCalled();
  });

  // An inline error should appear as soon as the user types a short password,
  // so they can correct it before attempting to submit.
  it("shows a password-length error when password is fewer than 8 characters", () => {
    const { getByText, getByPlaceholderText } = render(<SignUp />);
    fireEvent.changeText(getByPlaceholderText("At least 8 characters"), "short");
    expect(getByText("Password must be at least 8 characters")).toBeTruthy();
  });

  // The canSubmit gate must block submission when passwords differ.
  it("does not call signUp.create when passwords do not match", () => {
    const mockSignUp = setupClerk();
    const { getAllByText, getByPlaceholderText } = render(<SignUp />);
    fireEvent.changeText(getByPlaceholderText("John Doe"),               "Jane Doe");
    fireEvent.changeText(getByPlaceholderText("john.doe@example.com"),   "jane@example.com");
    fireEvent.changeText(getByPlaceholderText("At least 8 characters"),  "password123");
    fireEvent.changeText(getByPlaceholderText("Re-enter your password"), "different123");
    pressSubmit(getAllByText);
    expect(mockSignUp.create).not.toHaveBeenCalled();
  });

  // An email without "." is invalid — the button must stay disabled even when
  // the other fields are filled correctly.
  it("does not call signUp.create when the email has no dot", () => {
    const mockSignUp = setupClerk();
    const { getAllByText, getByPlaceholderText } = render(<SignUp />);
    fireEvent.changeText(getByPlaceholderText("John Doe"),               "Jane Doe");
    fireEvent.changeText(getByPlaceholderText("john.doe@example.com"),   "jane@nodot");
    fireEvent.changeText(getByPlaceholderText("At least 8 characters"),  "password123");
    fireEvent.changeText(getByPlaceholderText("Re-enter your password"), "password123");
    pressSubmit(getAllByText);
    expect(mockSignUp.create).not.toHaveBeenCalled();
  });
});

describe("SignUp screen — successful submission", () => {
  // "First Last" must be split into firstName/lastName before being sent to Clerk.
  it("calls signUp.create with parsed firstName, lastName, email, and password", async () => {
    const mockSignUp = setupClerk();
    const { getAllByText, getByPlaceholderText } = render(<SignUp />);
    fireEvent.changeText(getByPlaceholderText("John Doe"),               "Jane Doe");
    fireEvent.changeText(getByPlaceholderText("john.doe@example.com"),   "jane@example.com");
    fireEvent.changeText(getByPlaceholderText("At least 8 characters"),  "password123");
    fireEvent.changeText(getByPlaceholderText("Re-enter your password"), "password123");
    pressSubmit(getAllByText);
    await waitFor(() => {
      expect(mockSignUp.create).toHaveBeenCalledWith({
        firstName:    "Jane",
        lastName:     "Doe",
        emailAddress: "jane@example.com",
        password:     "password123",
      });
    });
  });

  // The verification email must be dispatched immediately after a successful create.
  it("calls sendEmailCode after a successful create", async () => {
    const mockSignUp = setupClerk();
    const { getAllByText, getByPlaceholderText } = render(<SignUp />);
    fireEvent.changeText(getByPlaceholderText("John Doe"),               "Jane Doe");
    fireEvent.changeText(getByPlaceholderText("john.doe@example.com"),   "jane@example.com");
    fireEvent.changeText(getByPlaceholderText("At least 8 characters"),  "password123");
    fireEvent.changeText(getByPlaceholderText("Re-enter your password"), "password123");
    pressSubmit(getAllByText);
    await waitFor(() => {
      expect(mockSignUp.verifications.sendEmailCode).toHaveBeenCalledTimes(1);
    });
  });
});

describe("SignUp screen — error handling", () => {
  // When Clerk rejects the create call the error message must appear on screen.
  it("shows an error message when signUp.create returns an error", async () => {
    setupClerk({
      create: jest.fn().mockResolvedValue({
        error: { longMessage: "Email already in use." },
      }),
    });
    const { getByText, getAllByText, getByPlaceholderText } = render(<SignUp />);
    fireEvent.changeText(getByPlaceholderText("John Doe"),               "Jane Doe");
    fireEvent.changeText(getByPlaceholderText("john.doe@example.com"),   "jane@example.com");
    fireEvent.changeText(getByPlaceholderText("At least 8 characters"),  "password123");
    fireEvent.changeText(getByPlaceholderText("Re-enter your password"), "password123");
    pressSubmit(getAllByText);
    await waitFor(() => {
      expect(getByText("Email already in use.")).toBeTruthy();
    });
  });
});

describe("SignUp screen — email verification step", () => {
  // Once the email is sent Clerk sets status to "missing_requirements".
  // The screen must switch to the code-entry UI at that point.
  it("renders the verification UI when email needs confirming", () => {
    setupClerk({
      status:           "missing_requirements",
      unverifiedFields: ["email_address"],
      missingFields:    [],
    });
    const { getByText, getByPlaceholderText } = render(<SignUp />);
    expect(getByText("Verify your email")).toBeTruthy();
    expect(getByPlaceholderText("000000")).toBeTruthy();
  });
});
