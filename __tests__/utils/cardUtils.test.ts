// Tests for detectCardType() and formatExpiry() in utils/cardUtils.ts.
// Date tested: 2026-05-25
//   detectCardType — identifies the card network from the card number prefix
//   formatExpiry   — formats a raw digit string into MM/YY display format
import { detectCardType, formatExpiry } from "@/utils/cardUtils";

describe("detectCardType", () => {
  // All card numbers starting with "4" are Visa regardless of length.
  it("detects Visa for 4-prefix", () => {
    expect(detectCardType("4111111111111111")).toBe("Visa");
  });

  // All card numbers starting with "5" are Mastercard (traditional 5-series).
  it("detects Mastercard for 5-prefix", () => {
    expect(detectCardType("5100000000000000")).toBe("Mastercard");
  });

  // Mastercard also covers a 2-series BIN range: 2221–2720.
  // This tests the exact lower boundary (2221) — the first valid 2-series BIN.
  it("detects Mastercard at lower bound of 2-series (2221)", () => {
    expect(detectCardType("2221000000000000")).toBe("Mastercard");
  });

  // This tests the exact upper boundary (2720) — the last valid 2-series BIN.
  it("detects Mastercard at upper bound of 2-series (2720)", () => {
    expect(detectCardType("2720000000000000")).toBe("Mastercard");
  });

  // A 2-prefix card with BIN 2200 is below the valid range and must not be
  // classified as Mastercard.
  it("returns Other for 2-prefix below 2221", () => {
    expect(detectCardType("2200000000000000")).toBe("Other");
  });

  // A 2-prefix card with BIN 2721 is above the valid range and must not be
  // classified as Mastercard.
  it("returns Other for 2-prefix above 2720", () => {
    expect(detectCardType("2721000000000000")).toBe("Other");
  });

  // All card numbers starting with "3" are American Express.
  it("detects Amex for 3-prefix", () => {
    expect(detectCardType("3400000000000000")).toBe("Amex");
  });

  // Any prefix not matched by the above rules (e.g. "6" for Discover) should
  // fall through to the "Other" default.
  it("returns Other for unknown prefix", () => {
    expect(detectCardType("6011000000000000")).toBe("Other");
  });
});

describe("formatExpiry", () => {
  // Two digits represent a complete month — no slash should be added yet.
  it("returns 2 digits unchanged", () => {
    expect(formatExpiry("12")).toBe("12");
  });

  // A single digit is an incomplete month — it should be returned as-is.
  it("returns 1 digit unchanged", () => {
    expect(formatExpiry("1")).toBe("1");
  });

  // Four digits represent a complete MM/YY expiry — a slash must be inserted
  // after the second digit.
  it("inserts slash after month digits for full input", () => {
    expect(formatExpiry("1234")).toBe("12/34");
  });

  // Three digits represent a month + partial year — the slash should still be
  // inserted after the second digit with the remaining digit following.
  it("handles partial year input", () => {
    expect(formatExpiry("123")).toBe("12/3");
  });

  // Non-digit characters in the input (e.g. typed letters) should be stripped
  // before formatting so the output only ever contains digits and a slash.
  it("strips non-digit characters before formatting", () => {
    expect(formatExpiry("12ab34")).toBe("12/34");
  });

  // Inputs longer than 4 digits should be truncated — only the first 4 digits
  // are used to prevent overflow beyond MM/YY.
  it("caps output at 4 digits", () => {
    expect(formatExpiry("12345678")).toBe("12/34");
  });

  // An empty string should return an empty string without errors.
  it("returns empty string for empty input", () => {
    expect(formatExpiry("")).toBe("");
  });
});
