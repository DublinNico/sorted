// Tests for withOpacity() in constants/theme.ts.
// Date tested: 2026-05-25
// withOpacity appends a two-digit hex alpha channel to a 6-digit hex colour
// string, clamping the opacity value to the 0–1 range.
import { withOpacity } from "@/constants/theme";

describe("withOpacity", () => {
  // Opacity of 0 means fully transparent — alpha channel should be "00".
  it("appends 00 alpha for opacity 0", () => {
    expect(withOpacity("#C9A84C", 0)).toBe("#C9A84C00");
  });

  // Opacity of 1 means fully opaque — alpha channel should be "ff" (255 in hex).
  it("appends ff alpha for opacity 1", () => {
    expect(withOpacity("#C9A84C", 1)).toBe("#C9A84Cff");
  });

  // Opacity of 0.5 → Math.round(0.5 * 255) = 128 = 0x80.
  it("appends 80 alpha for opacity 0.5", () => {
    expect(withOpacity("#C9A84C", 0.5)).toBe("#C9A84C80");
  });

  // Values below 0 must be clamped to 0 so the output is never invalid.
  it("clamps opacity below 0 to 00", () => {
    expect(withOpacity("#C9A84C", -1)).toBe("#C9A84C00");
  });

  // Values above 1 must be clamped to 1 so the output is never invalid.
  it("clamps opacity above 1 to ff", () => {
    expect(withOpacity("#C9A84C", 2)).toBe("#C9A84Cff");
  });

  // A 6-digit hex input + 2-digit alpha must always produce exactly 9 characters.
  it("produces a 9-character string for a 6-digit hex input", () => {
    expect(withOpacity("#123456", 0.75)).toHaveLength(9);
  });

  // When the alpha value is a single hex digit (e.g. "0"), padStart must pad it
  // to two digits so the resulting colour string stays valid (#RRGGBBAA format).
  it("pads single-digit hex alpha values to two digits", () => {
    const result = withOpacity("#000000", 0);
    expect(result).toBe("#00000000");
  });
});
