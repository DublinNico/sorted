export type CardType = "Visa" | "Mastercard" | "Amex" | "Other";

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

export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  const monthInt = parseInt(digits.slice(0, 2), 10);
  if (monthInt < 1 || monthInt > 12) return digits.slice(0, 2);
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
