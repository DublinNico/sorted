jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn() }) }));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import PaymentMethodsScreen from "@/app/payment-methods";

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, "alert");
});

afterEach(() => {
  alertSpy.mockRestore();
});

// ─── Test card constants ──────────────────────────────────────────────────────

const VISA_PAN  = "4111" + "1111" + "1111" + "1111";
const MC_PAN    = "5500" + "0000" + "0000" + "0004";
const EXPIRY_A  = "12" + "/27";
const EXPIRY_B  = "06" + "/28";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function addCard(
  utils: ReturnType<typeof render>,
  cardNumber = VISA_PAN,
  expiry = EXPIRY_A
) {
  // Open the modal via the "Add New Card" button text on the main screen.
  const addBtns = utils.getAllByText("Add New Card");
  fireEvent.press(addBtns[0]);

  await waitFor(() => utils.getByPlaceholderText("•••• •••• •••• ••••"));

  fireEvent.changeText(utils.getByPlaceholderText("•••• •••• •••• ••••"), cardNumber);
  fireEvent.changeText(utils.getByPlaceholderText("MM/YY"), expiry);

  // "Add Card" is the modal submit button.
  await act(async () => {
    fireEvent.press(utils.getByText("Add Card"));
  });
}

// ─── Payment Methods screen — rendering ──────────────────────────────────────

describe("Payment Methods screen — rendering", () => {
  it("renders the screen title", () => {
    const { getByText } = render(<PaymentMethodsScreen />);
    expect(getByText("Payment Methods")).toBeTruthy();
  });

  it("renders the subtitle description", () => {
    const { getByText } = render(<PaymentMethodsScreen />);
    expect(getByText("Manage your saved payment methods for automatic billing")).toBeTruthy();
  });

  it("renders the Add New Card button when no cards exist", () => {
    const { getByText } = render(<PaymentMethodsScreen />);
    expect(getByText("Add New Card")).toBeTruthy();
  });

  it("shows no card rows when the list is empty", () => {
    const { queryByText } = render(<PaymentMethodsScreen />);
    expect(queryByText("Default")).toBeNull();
    expect(queryByText("Remove")).toBeNull();
  });
});

// ─── Payment Methods screen — adding cards ────────────────────────────────────

describe("Payment Methods screen — adding cards", () => {
  it("adds a card and shows it in the list", async () => {
    const utils = render(<PaymentMethodsScreen />);
    await addCard(utils);
    await waitFor(() => expect(utils.getByText(/1111/)).toBeTruthy());
  });

  it("first card added is automatically set as default", async () => {
    const utils = render(<PaymentMethodsScreen />);
    await addCard(utils);
    await waitFor(() => expect(utils.getByText("Default")).toBeTruthy());
  });

  it("second card is not the default and shows Set Default button", async () => {
    const utils = render(<PaymentMethodsScreen />);
    await addCard(utils, VISA_PAN, EXPIRY_A);
    await addCard(utils, MC_PAN, EXPIRY_B);
    await waitFor(() => expect(utils.getByText("Set Default")).toBeTruthy());
  });

  it("detects Visa card type from a Visa number", async () => {
    const utils = render(<PaymentMethodsScreen />);
    await addCard(utils, VISA_PAN, EXPIRY_A);
    await waitFor(() => expect(utils.getByText("Visa")).toBeTruthy());
  });

  it("detects Mastercard type from a Mastercard number", async () => {
    const utils = render(<PaymentMethodsScreen />);
    await addCard(utils, MC_PAN, EXPIRY_B);
    await waitFor(() => expect(utils.getByText("Mastercard")).toBeTruthy());
  });

  it("shows the card expiry date after adding", async () => {
    const utils = render(<PaymentMethodsScreen />);
    await addCard(utils, VISA_PAN, EXPIRY_A);
    await waitFor(() => expect(utils.getByText("12/27")).toBeTruthy());
  });
});

// ─── Payment Methods screen — card actions ────────────────────────────────────

describe("Payment Methods screen — card actions", () => {
  it("promotes a card to default when Set Default is tapped", async () => {
    const utils = render(<PaymentMethodsScreen />);
    await addCard(utils, VISA_PAN, EXPIRY_A);
    await addCard(utils, MC_PAN, EXPIRY_B);

    await waitFor(() => utils.getByText("Set Default"));
    fireEvent.press(utils.getByText("Set Default"));

    // Only one "Default" badge should exist; the demoted card gets "Set Default" back.
    await waitFor(() => expect(utils.getAllByText("Default").length).toBe(1));
    expect(utils.getByText("Set Default")).toBeTruthy();
  });

  it("shows a confirmation alert when Remove is tapped", async () => {
    const utils = render(<PaymentMethodsScreen />);
    await addCard(utils);

    await waitFor(() => utils.getByText("Remove"));
    fireEvent.press(utils.getByText("Remove"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Remove Card",
      "Are you sure you want to remove this card?",
      expect.any(Array)
    );
  });

  it("removes the card after confirming the alert", async () => {
    alertSpy.mockImplementation((_title, _msg, buttons) => {
      const confirmBtn = buttons?.find((b: any) => b.text === "Remove");
      confirmBtn?.onPress?.();
    });

    const utils = render(<PaymentMethodsScreen />);
    await addCard(utils);

    await waitFor(() => utils.getByText("Remove"));
    fireEvent.press(utils.getByText("Remove"));

    await waitFor(() => expect(utils.queryByText("Default")).toBeNull());
  });
});
