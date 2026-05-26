export type CardType = "Visa" | "Mastercard" | "Amex" | "Other";

/**
 * Determines the payment card brand from a card number string using common BIN/prefix rules.
 *
 * @param number - The card number digits as a string (may be partial); only leading digits are inspected.
 * @returns `"Visa"` for numbers starting with `4`; `"Mastercard"` for prefix ranges `51–55` or `2221–2720` (2-series); `"Amex"` for prefixes `34` or `37`; `"Other"` otherwise.
 */
export function detectCardType(number: string): CardType {
  if (number.startsWith("4")) return "Visa";
  // Mastercard classic: BIN range 51–55 only (not 50 or 56–59)
  const prefix2d = parseInt(number.slice(0, 2), 10);
  if (prefix2d >= 51 && prefix2d <= 55) return "Mastercard";
  // Mastercard 2-series: BIN range 2221–2720 only
  const prefix4 = parseInt(number.slice(0, 4), 10);
  if (number.startsWith("2") && prefix4 >= 2221 && prefix4 <= 2720) return "Mastercard";
  // Amex: starts with 34 or 37 only (not all 3x)
  if (number.startsWith("34") || number.startsWith("37")) return "Amex";
  return "Other";
}

/**
 * Normalize a raw expiry input into a card expiry string.
 *
 * Removes all non-digit characters, truncates to at most four digits, and validates the month.
 * - If the cleaned input has 0–2 digits, returns those digits unchanged.
 * - If the first two digits are not a valid month (not between 1 and 12), returns the first two digits.
 * - If the month is valid, returns `MM/YY` where `MM` is the first two digits and `YY` are the remaining digits (up to two).
 *
 * @param raw - The raw expiry input (may include non-digit characters)
 * @returns `MM/YY` for a valid month with year digits, `MM` if the month is invalid, or the digit sequence (up to four digits) when shorter than three digits
 */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  const monthInt = parseInt(digits.slice(0, 2), 10);
  if (monthInt < 1 || monthInt > 12) return digits.slice(0, 2);
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
