export const DOMAIN_OVERRIDES: Record<string, string> = {
  // ── Energy suppliers ──────────────────────────────────────────────────────
  esb:                    "esb.ie",
  "electric ireland":     "electricireland.ie",
  energia:                "energia.ie",
  "sse airtricity":       "sseairtricity.com",
  airtricity:             "sseairtricity.com",
  "bord gais energy":     "bordgaisenergy.ie",
  "bord gáis energy":     "bordgaisenergy.ie",
  "bord gais":            "bordgaisenergy.ie",
  "bord gáis":            "bordgaisenergy.ie",
  prepaypower:            "prepaypower.ie",
  "prepay power":         "prepaypower.ie",
  pinergy:                "pinergy.ie",
  flogas:                 "flogas.ie",
  "community power":      "communitypower.ie",
  waterpower:             "waterpower.ie",
  "water power":          "waterpower.ie",
  "yuno energy":          "yunoenergy.ie",
  yuno:                   "yunoenergy.ie",
  "go power":             "gopower.ie",

  // ── Water ─────────────────────────────────────────────────────────────────
  "uisce éireann":        "water.ie",
  "uisce eireann":        "water.ie",
  "irish water":          "water.ie",

  // ── Telecoms ──────────────────────────────────────────────────────────────
  eir:                    "eir.ie",
  vodafone:               "vodafone.com",
  "vodafone ireland":     "vodafone.com",
  "virgin media":         "virginmedia.ie",
  sky:                    "sky.com",
  "sky ireland":          "sky.com",
  three:                  "three.ie",
  "three ireland":        "three.ie",
  "pure telecom":         "puretelecom.ie",
  digiweb:                "digiweb.ie",
  imagine:                "imagine.ie",
  siro:                   "siro.ie",

  // ── Waste ─────────────────────────────────────────────────────────────────
  greyhound:              "greyhound.ie",
  panda:                  "panda.ie",
  "thorntons recycling":  "thorntons-recycling.ie",
  thorntons:              "thorntons-recycling.ie",
  "city bin co":          "citybin.com",
  "city bin":             "citybin.com",
  oxigen:                 "oxigen.ie",
  kwd:                    "kwd.ie",

  // ── Banks & Finance ───────────────────────────────────────────────────────
  aib:                    "aib.ie",
  "bank of ireland":      "bankofireland.com",
  "permanent tsb":        "permanenttsb.ie",
  ptsb:                   "permanenttsb.ie",
  "an post money":        "anpost.ie",
  "avant money":          "avantmoney.ie",
  ebs:                    "ebs.ie",
  revolut:                "revolut.com",
  n26:                    "n26.com",
  bunq:                   "bunq.com",

  // ── Insurance ─────────────────────────────────────────────────────────────
  aviva:                  "aviva.ie",
  zurich:                 "zurich.ie",
  axa:                    "axa.ie",
  allianz:                "allianz.ie",
  fbd:                    "fbd.ie",
  "liberty insurance":    "libertymutual.com",
  rsa:                    "rsagroup.com",
  vhi:                    "vhi.ie",
  "laya healthcare":      "layahealthcare.ie",
  laya:                   "layahealthcare.ie",
  "irish life health":    "irishlifehealth.ie",
  "irish life":           "irishlife.ie",

  // ── Government & services ─────────────────────────────────────────────────
  "an post":              "anpost.ie",
  "revenue commissioners":"revenue.ie",
  "local property tax":   "revenue.ie",
  "motor tax":            "motortax.ie",
  "residential tenancies board": "rtb.ie",
  rtb:                    "rtb.ie",

  // ── Housing ───────────────────────────────────────────────────────────────
  "tuath housing":        "tuathhousing.ie",
  tuath:                  "tuathhousing.ie",

  // ── Gyms & Fitness ────────────────────────────────────────────────────────
  flyefit:                "flyefit.ie",
  "energie fitness":      "energiefitness.com",
  energie:                "energiefitness.com",
  puregym:                "puregym.com",
  "pure gym":             "puregym.com",
  "westwood club":        "westwoodclub.com",
  westwood:               "westwoodclub.com",
  fit4less:               "fit4less.ie",
  "fit 4 less":           "fit4less.ie",
  "snap fitness":         "snapfitness.com",
  snap:                   "snapfitness.com",
  "anytime fitness":      "anytimefitness.com",
  anytime:                "anytimefitness.com",
  "david lloyd":          "davidlloyd.ie",
  "the gym":              "thegymgroup.com",
  "the gym group":        "thegymgroup.com",
  crunch:                 "crunch.com",
  "crunch fitness":       "crunch.com",
  "les mills":            "lesmills.com",
  "zone fitness":         "zonefitness.ie",
  "hiit republic":        "hiitrepublic.ie",
  hiit:                   "hiitrepublic.ie",
  "gain fitness":         "gainfitness.ie",
  "lifestyle fitness":    "lifestylefitness.ie",

  // ── Estate agents ─────────────────────────────────────────────────────────
  dng:                    "dng.ie",
  "sherry fitzgerald":    "sherryfitz.ie",
  "hooke & macdonald":    "hookemacdonald.ie",
  "hooke and macdonald":  "hookemacdonald.ie",
  hooke:                  "hookemacdonald.ie",
  lisney:                 "lisney.ie",
  "owen reilly":          "owenreilly.com",
};

export function getDomain(name: string): string {
  const lower     = name.trim().toLowerCase();
  const firstWord = lower.split(/\s+/)[0];
  return DOMAIN_OVERRIDES[lower] ?? DOMAIN_OVERRIDES[firstWord] ?? `${firstWord}.com`;
}
