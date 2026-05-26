// Tests for getDomain() and the DOMAIN_OVERRIDES table in utils/domainUtils.ts.
// Date tested: 2026-05-25
// getDomain resolves a human-readable service name to a canonical domain used
// to fetch the service logo from the Logos API.
// Resolution order: exact full-name match → first-word match → firstword.com fallback.
import { DOMAIN_OVERRIDES, getDomain } from "@/utils/domainUtils";

describe("getDomain", () => {
  // A name with no match anywhere in the table should fall back to
  // lowercased-firstword + ".com".
  it("falls back to firstword.com for an unknown name", () => {
    expect(getDomain("Netflix")).toBe("netflix.com");
  });

  // The lookup is case-insensitive, so "Eir" and "eir" must both resolve
  // to the same domain entry.
  it("matches an exact single-word entry case-insensitively", () => {
    expect(getDomain("Eir")).toBe("eir.ie");
    expect(getDomain("eir")).toBe("eir.ie");
  });

  // Multi-word service names that exist verbatim in the table should be
  // matched on the full normalised string.
  it("matches an exact multi-word entry", () => {
    expect(getDomain("bord gáis energy")).toBe("bordgaisenergy.ie");
  });

  // Multi-word entries should also be resolved case-insensitively so that
  // user-typed names like "Virgin Media" still match.
  it("matches a multi-word entry case-insensitively", () => {
    expect(getDomain("Virgin Media")).toBe("virginmedia.ie");
  });

  // Leading and trailing whitespace should be trimmed before lookup so that
  // copy-pasted names with extra spaces still resolve correctly.
  it("trims surrounding whitespace before lookup", () => {
    expect(getDomain("  esb  ")).toBe("esb.ie");
  });

  // A multi-word name where neither the full string nor its first word appears
  // in the table should fall back to firstword + ".com".
  it("falls back to firstword.com for a completely unknown multi-word name", () => {
    expect(getDomain("some unknown service")).toBe("some.com");
  });

  // When the full name is not in the table but the first word is, the first-word
  // entry should be used as a fallback before resorting to ".com".
  it("uses first-word fallback when full name is not in the table", () => {
    expect(getDomain("greyhound waste services")).toBe("greyhound.ie");
  });

  // Irish-accented characters (é, á, etc.) in service names must be preserved
  // and matched correctly against the table entries.
  it("handles an Irish accent character in the lookup", () => {
    expect(getDomain("uisce éireann")).toBe("water.ie");
  });
});

describe("DOMAIN_OVERRIDES", () => {
  // Spot-check: the table must contain entries for common Irish energy suppliers
  // so their logos resolve correctly without falling back to ".com".
  it("includes Irish energy suppliers", () => {
    expect(DOMAIN_OVERRIDES["esb"]).toBe("esb.ie");
    expect(DOMAIN_OVERRIDES["energia"]).toBe("energia.ie");
  });

  // Spot-check: Irish and international telecoms providers must be present.
  it("includes telecoms entries", () => {
    expect(DOMAIN_OVERRIDES["eir"]).toBe("eir.ie");
    expect(DOMAIN_OVERRIDES["vodafone"]).toBe("vodafone.com");
  });

  // Spot-check: Irish gym brands added as part of the Fitness category must
  // resolve to their correct domains.
  it("includes gym entries", () => {
    expect(DOMAIN_OVERRIDES["flyefit"]).toBe("flyefit.ie");
    expect(DOMAIN_OVERRIDES["puregym"]).toBe("puregym.com");
  });

  // Spot-check: Irish banks and fintech providers must be in the table so
  // their logos load rather than falling back to generic ".com" domains.
  it("includes Irish bank entries", () => {
    expect(DOMAIN_OVERRIDES["aib"]).toBe("aib.ie");
    expect(DOMAIN_OVERRIDES["revolut"]).toBe("revolut.com");
  });
});
