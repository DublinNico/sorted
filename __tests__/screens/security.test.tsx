jest.mock("@clerk/expo", () => ({
  useUser: () => ({
    user: {
      primaryEmailAddress: { emailAddress: "alice@example.com" },
      updatePassword: mockUpdatePassword,
    },
  }),
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn() }) }));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

jest.mock("@/utils/biometrics", () => ({
  isBiometricsSupported:   jest.fn().mockResolvedValue(true),
  isBiometricsEnabled:     jest.fn().mockResolvedValue(false),
  setBiometricsEnabled:    jest.fn().mockResolvedValue(undefined),
  saveCredentials:         jest.fn().mockResolvedValue(undefined),
  authenticateWithBiometrics: jest.fn().mockResolvedValue(true),
}));

import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import SecurityScreen from "@/app/security";

const mockUpdatePassword = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Security screen — rendering ──────────────────────────────────────────────

describe("Security screen — rendering", () => {
  it("renders the Security title", async () => {
    const { getByText } = render(<SecurityScreen />);
    await waitFor(() => expect(getByText("Security")).toBeTruthy());
  });

  it("renders the CHANGE PASSWORD section header", async () => {
    const { getByText } = render(<SecurityScreen />);
    await waitFor(() => expect(getByText("CHANGE PASSWORD")).toBeTruthy());
  });

  it("renders the SECURITY OPTIONS section header", async () => {
    const { getByText } = render(<SecurityScreen />);
    await waitFor(() => expect(getByText("SECURITY OPTIONS")).toBeTruthy());
  });

  it("renders the Biometric Login row", async () => {
    const { getByText } = render(<SecurityScreen />);
    await waitFor(() => expect(getByText("Biometric Login")).toBeTruthy());
  });

  it("renders the Two-Factor Authentication row", async () => {
    const { getByText } = render(<SecurityScreen />);
    await waitFor(() => expect(getByText("Two-Factor Authentication")).toBeTruthy());
  });

  it("renders Two-Factor as coming soon", async () => {
    const { getByText } = render(<SecurityScreen />);
    await waitFor(() => expect(getByText("Coming soon")).toBeTruthy());
  });

  it("renders the Data Privacy section", async () => {
    const { getByText } = render(<SecurityScreen />);
    await waitFor(() => expect(getByText("Data Privacy")).toBeTruthy());
  });

  it("renders the View Privacy Policy link", async () => {
    const { getByText } = render(<SecurityScreen />);
    await waitFor(() => expect(getByText("View Privacy Policy →")).toBeTruthy());
  });
});

// ─── Security screen — Update Password button state ───────────────────────────

describe("Security screen — Update Password button", () => {
  it("is disabled when both fields are empty", async () => {
    const { getByText } = render(<SecurityScreen />);
    await waitFor(() => getByText("Update Password"));
    const btn = getByText("Update Password");
    // The button's parent TouchableOpacity has disabled prop; pressing should not call updatePassword.
    fireEvent.press(btn);
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("is disabled when new password is fewer than 8 characters", async () => {
    const { getByText, getByPlaceholderText } = render(<SecurityScreen />);
    await waitFor(() => getByText("Update Password"));
    fireEvent.changeText(getByPlaceholderText("Enter current password"), "mypassword");
    fireEvent.changeText(getByPlaceholderText("Enter new password"), "short");
    fireEvent.press(getByText("Update Password"));
    expect(mockUpdatePassword).not.toHaveBeenCalled();
  });

  it("calls updatePassword when both fields are valid", async () => {
    const { getByText, getByPlaceholderText } = render(<SecurityScreen />);
    await waitFor(() => getByText("Update Password"));
    fireEvent.changeText(getByPlaceholderText("Enter current password"), "currentpass");
    fireEvent.changeText(getByPlaceholderText("Enter new password"), "newpassword123");
    await act(async () => {
      fireEvent.press(getByText("Update Password"));
    });
    expect(mockUpdatePassword).toHaveBeenCalledWith({
      currentPassword: "currentpass",
      newPassword: "newpassword123",
    });
  });
});
