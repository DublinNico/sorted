jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { version: "1.2.3" } },
}));

jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn() }) }));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { Linking } from "react-native";
import HelpSupportScreen from "@/app/help-support";

let openURLSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
});

afterEach(() => {
  openURLSpy.mockRestore();
});

// ─── Help & Support screen — rendering ───────────────────────────────────────

describe("Help & Support screen — rendering", () => {
  it("renders the screen title", () => {
    const { getByText } = render(<HelpSupportScreen />);
    expect(getByText("Help & Support")).toBeTruthy();
  });

  it("renders the FAQ section header", () => {
    const { getByText } = render(<HelpSupportScreen />);
    expect(getByText("FREQUENTLY ASKED QUESTIONS")).toBeTruthy();
  });

  it("renders all FAQ questions", () => {
    const { getByText } = render(<HelpSupportScreen />);
    expect(getByText("How do I add a new subscription?")).toBeTruthy();
    expect(getByText("Can I track utility bills?")).toBeTruthy();
    expect(getByText("How do I export my data?")).toBeTruthy();
    expect(getByText("What payment methods are supported?")).toBeTruthy();
    expect(getByText("How do I cancel a subscription?")).toBeTruthy();
    expect(getByText("Is my data secure?")).toBeTruthy();
  });

  it("renders the Email Support contact option", () => {
    const { getByText } = render(<HelpSupportScreen />);
    expect(getByText("Email Support")).toBeTruthy();
    expect(getByText("support@sorted.ie")).toBeTruthy();
  });

  it("renders Live Chat as coming soon", () => {
    const { getByText } = render(<HelpSupportScreen />);
    expect(getByText("Live Chat")).toBeTruthy();
  });

  it("renders Documentation as coming soon", () => {
    const { getByText } = render(<HelpSupportScreen />);
    expect(getByText("Documentation")).toBeTruthy();
  });

  it("renders the app version in the footer", () => {
    const { getByText } = render(<HelpSupportScreen />);
    expect(getByText("Version 1.2.3")).toBeTruthy();
  });

  it("renders Terms of Service and Privacy Policy links in the footer", () => {
    const { getByText } = render(<HelpSupportScreen />);
    expect(getByText("Terms of Service")).toBeTruthy();
    expect(getByText("Privacy Policy")).toBeTruthy();
  });
});

// ─── Help & Support screen — actions ─────────────────────────────────────────

describe("Help & Support screen — actions", () => {
  it("opens the support email when Email Support is tapped", () => {
    const { getByText } = render(<HelpSupportScreen />);
    fireEvent.press(getByText("Email Support"));
    expect(Linking.openURL).toHaveBeenCalledWith("mailto:support@sorted.ie");
  });

  it("opens Terms of Service URL when tapped", () => {
    const { getByText } = render(<HelpSupportScreen />);
    fireEvent.press(getByText("Terms of Service"));
    expect(Linking.openURL).toHaveBeenCalledWith("https://dublinnico.github.io/terms.html");
  });

  it("opens Privacy Policy URL when tapped", () => {
    const { getByText } = render(<HelpSupportScreen />);
    fireEvent.press(getByText("Privacy Policy"));
    expect(Linking.openURL).toHaveBeenCalledWith("https://dublinnico.github.io/privacy.html");
  });
});
