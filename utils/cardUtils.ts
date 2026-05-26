export type CardType = "Visa" | "Mastercard" | "Amex" | "Other";

export function detectCardType(number: string): CardType {
  if (number.startsWith("4")) return "Visa";
  if (number.startsWith("5")) return "Mastercard";
  // Mastercard 2-series: BIN range 2221–2720 only
  const prefix2 = parseInt(number.slice(0, 4), 10);
  if (number.startsWith("2") && prefix2 >= 2221 && prefix2 <= 2720) return "Mastercard";
  if (number.startsWith("3")) return "Amex";
  return "Other";
}

export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
