// Tests for the three pure formatting utilities in lib/utils.ts.
// Date tested: 2026-05-25
//   formatCurrency        — formats a number as a localised currency string
//   formatSubscriptionDateTime — formats an ISO date string to MM/DD/YYYY
//   formatStatusLabel     — capitalises the first letter of a status string
import { formatCurrency, formatStatusLabel, formatSubscriptionDateTime } from "@/lib/utils";

describe("formatCurrency", () => {
  // A zero value should still produce a properly formatted string with decimal places.
  it("formats zero in EUR", () => {
    expect(formatCurrency(0)).toContain("0.00");
  });

  // A standard decimal amount should include the euro symbol and the correct number.
  it("formats a decimal amount in EUR", () => {
    const result = formatCurrency(9.99);
    expect(result).toContain("9.99");
    expect(result).toContain("€");
  });

  // Amounts in the thousands should include a comma separator and the euro symbol.
  it("formats a large amount with thousand separator", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1,234.56");
    expect(result).toContain("€");
  });

  // Passing "USD" as the currency should produce a valid formatted string
  // containing the numeric value (exact symbol varies by Node ICU data).
  it("formats USD amount", () => {
    const result = formatCurrency(9.99, "USD");
    expect(result).toContain("9.99");
  });

  // Passing "GBP" should produce a valid formatted string containing the number.
  it("formats GBP amount", () => {
    const result = formatCurrency(9.99, "GBP");
    expect(result).toContain("9.99");
  });
});

describe("formatSubscriptionDateTime", () => {
  // When no value is passed the function must return a safe fallback string.
  it("returns Not provided for undefined", () => {
    expect(formatSubscriptionDateTime(undefined)).toBe("Not provided");
  });

  // An empty string is falsy and should be treated the same as no value.
  it("returns Not provided for empty string", () => {
    expect(formatSubscriptionDateTime("")).toBe("Not provided");
  });

  // A full ISO 8601 timestamp should be formatted as MM/DD/YYYY.
  it("formats a valid ISO date to MM/DD/YYYY", () => {
    expect(formatSubscriptionDateTime("2024-03-15T00:00:00.000Z")).toBe("03/15/2024");
  });

  // A date-only string (without time component) should also parse and format correctly.
  it("formats a date-only string", () => {
    expect(formatSubscriptionDateTime("2024-01-01")).toBe("01/01/2024");
  });

  // A string that dayjs cannot parse should return the safe fallback rather than
  // an invalid date string being shown in the UI.
  it("returns Not provided for an unparseable string", () => {
    expect(formatSubscriptionDateTime("not-a-date")).toBe("Not provided");
  });
});

describe("formatStatusLabel", () => {
  // When no value is passed the function must return "Unknown" rather than crashing.
  it("returns Unknown for undefined", () => {
    expect(formatStatusLabel(undefined)).toBe("Unknown");
  });

  // A lowercase status string like "active" should be displayed with a capital A.
  it("capitalizes the first letter of active", () => {
    expect(formatStatusLabel("active")).toBe("Active");
  });

  // Multi-character lowercase strings should have only the first letter capitalised.
  it("capitalizes the first letter of cancelled", () => {
    expect(formatStatusLabel("cancelled")).toBe("Cancelled");
  });

  // If the string is already capitalised, the function should not alter it.
  it("leaves an already-capitalised string unchanged", () => {
    expect(formatStatusLabel("Active")).toBe("Active");
  });

  // A single-character string should still be capitalised correctly.
  it("handles a single character", () => {
    expect(formatStatusLabel("a")).toBe("A");
  });
});
