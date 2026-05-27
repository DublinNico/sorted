const mockUpdate = jest.fn().mockResolvedValue(undefined);

jest.mock("@clerk/expo", () => ({
  useUser: () => ({ user: mockUserRef() }),
}));

jest.mock("@expo/vector-icons", () => ({ Ionicons: () => null }));

jest.mock("expo-router", () => ({ useRouter: () => ({ back: jest.fn() }) }));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View };
});

import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import ProfileScreen from "@/app/profile";

// ─── Mutable user fixture ─────────────────────────────────────────────────────

function mockUserRef() {
  return {
    firstName: "Alice",
    lastName: "Byrne",
    emailAddresses: [{ emailAddress: "alice@example.com" }],
    createdAt: new Date("2024-03-10"),
    update: mockUpdate,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Profile screen — rendering ───────────────────────────────────────────────

describe("Profile screen — rendering", () => {
  it("renders the Profile title", () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText("Profile")).toBeTruthy();
  });

  it("renders the Edit Profile card heading", () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText("Edit Profile")).toBeTruthy();
  });

  it("shows the user's display name in the avatar card", () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText("Alice Byrne")).toBeTruthy();
  });

  it("shows the user's email", () => {
    const { getAllByText } = render(<ProfileScreen />);
    expect(getAllByText("alice@example.com").length).toBeGreaterThan(0);
  });

  it("shows two-letter initials in the avatar", () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText("AB")).toBeTruthy();
  });

  it("renders first name and last name inputs pre-filled", () => {
    const { getByPlaceholderText } = render(<ProfileScreen />);
    expect(getByPlaceholderText("First name").props.value).toBe("Alice");
    expect(getByPlaceholderText("Last name").props.value).toBe("Byrne");
  });

  it("shows the Member Since label", () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText("Member Since")).toBeTruthy();
  });

  it("shows the formatted member since date", () => {
    const { getByText } = render(<ProfileScreen />);
    expect(getByText("March 2024")).toBeTruthy();
  });

  it("shows '—' when createdAt is not available", () => {
    let IsolatedProfile!: React.ComponentType<any>;
    jest.isolateModules(() => {
      jest.doMock("@clerk/expo", () => ({
        useUser: () => ({
          user: {
            firstName: "Alice",
            lastName: "Byrne",
            emailAddresses: [{ emailAddress: "alice@example.com" }],
            createdAt: null,
            update: mockUpdate,
          },
        }),
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      IsolatedProfile = require("@/app/profile").default;
    });
    const { getByText } = render(<IsolatedProfile />);
    expect(getByText("—")).toBeTruthy();
  });
});

// ─── Profile screen — Save button state ──────────────────────────────────────

describe("Profile screen — Save button", () => {
  it("Save Changes button is disabled when nothing has changed", () => {
    const { getByText } = render(<ProfileScreen />);
    const btn = getByText("Save Changes");
    fireEvent.press(btn);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("Save Changes button is enabled after editing first name", async () => {
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);
    fireEvent.changeText(getByPlaceholderText("First name"), "Alicia");
    await act(async () => {
      fireEvent.press(getByText("Save Changes"));
    });
    expect(mockUpdate).toHaveBeenCalledWith({ firstName: "Alicia", lastName: "Byrne" });
  });

  it("Save Changes button is enabled after editing last name", async () => {
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);
    fireEvent.changeText(getByPlaceholderText("Last name"), "Smith");
    await act(async () => {
      fireEvent.press(getByText("Save Changes"));
    });
    expect(mockUpdate).toHaveBeenCalledWith({ firstName: "Alice", lastName: "Smith" });
  });
});

// ─── Profile screen — save outcomes ──────────────────────────────────────────

describe("Profile screen — save outcomes", () => {
  it("shows success message after a successful save", async () => {
    mockUpdate.mockResolvedValueOnce(undefined);
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);
    fireEvent.changeText(getByPlaceholderText("First name"), "Alicia");
    await act(async () => {
      fireEvent.press(getByText("Save Changes"));
    });
    await waitFor(() => expect(getByText("Profile updated successfully.")).toBeTruthy());
  });

  it("shows error message when save fails", async () => {
    mockUpdate.mockRejectedValueOnce({ message: "Network error" });
    const { getByText, getByPlaceholderText } = render(<ProfileScreen />);
    fireEvent.changeText(getByPlaceholderText("First name"), "Alicia");
    await act(async () => {
      fireEvent.press(getByText("Save Changes"));
    });
    await waitFor(() => expect(getByText("Network error")).toBeTruthy());
  });
});
