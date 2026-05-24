/**
 * components/CreateSubscriptionModal.tsx  —  Add Subscription bottom sheet
 *
 * Redesigned to match the Figma "High-Fidelity Android UI Mockup" modal.
 *
 * Layout (top → bottom inside the sheet):
 *   1. Header row  — "New Subscription" title + circular close button
 *   2. Name field  — free-text input; used to derive the logos-api icon URL
 *   3. Price field — numeric decimal-pad input
 *   4. Frequency   — three-way segmented picker (Weekly / Monthly / Yearly)
 *   5. Category    — wrap-row of pill chips
 *   6. Submit CTA  — gold "Add Subscription" button (disabled when form is incomplete)
 *
 * On submit the component:
 *   • derives a domain from the subscription name (DOMAIN_OVERRIDES → fallback)
 *   • builds a logos-api URI for the service icon
 *   • assigns a deterministic colour from COLOR_PALETTE via a name hash
 *   • computes startDate (now) and renewalDate (now + 1 billing period)
 *   • fires a PostHog "subscription_created" event
 *   • calls the onSubmit prop with the completed Subscription payload
 *
 * The sheet sits on a 50%-opacity black overlay.  Tapping the overlay calls
 * onClose.  On iOS a KeyboardAvoidingView pushes the sheet above the keyboard.
 *
 * All theme colours come from the NativeWind classes defined in global.css
 * (modal-container, auth-input, etc.) — no hardcoded hex values except the
 * placeholder text colour which must be passed as a prop to TextInput.
 */

import "@/global.css";
import { colors } from "@/constants/theme";
import clsx from "clsx";
import dayjs from "dayjs";
import { usePostHog } from "posthog-react-native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

// ─── Domain lookup table ──────────────────────────────────────────────────────

/**
 * DOMAIN_OVERRIDES
 * Maps common Irish/global service names (lowercase) to their canonical domains
 * so the logos-api returns the correct service icon.
 *
 * Lookup order in getDomain():
 *   1. Exact full-name match  (e.g. "bord gáis energy" → "bordgaisenergy.ie")
 *   2. First-word match       (e.g. "vodafone ireland" → first word "vodafone")
 *   3. Fallback               (first word + ".com")
 */
const DOMAIN_OVERRIDES: Record<string, string> = {
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

  // ── Estate agents ─────────────────────────────────────────────────────────
  dng:                    "dng.ie",
  "sherry fitzgerald":    "sherryfitz.ie",
  "hooke & macdonald":    "hookemacdonald.ie",
  "hooke and macdonald":  "hookemacdonald.ie",
  hooke:                  "hookemacdonald.ie",
  lisney:                 "lisney.ie",
  "owen reilly":          "owenreilly.com",
};

/**
 * getDomain
 * Resolves a human-readable service name to a canonical domain string.
 * The domain is used to construct the logos-api icon URI.
 *
 * @param name  Raw service name entered by the user (any case)
 * @returns     Domain string, e.g. "netflix.com" or "eir.ie"
 */
const getDomain = (name: string): string => {
  const lower     = name.trim().toLowerCase();
  const firstWord = lower.split(/\s+/)[0];
  return DOMAIN_OVERRIDES[lower] ?? DOMAIN_OVERRIDES[firstWord] ?? `${firstWord}.com`;
};

// ─── Category list ────────────────────────────────────────────────────────────

/**
 * CATEGORIES
 * Ordered list of subscription categories shown as chip selectors.
 * Must stay in sync with the category options in the Subscriptions filter bar.
 */
const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

/** Union type derived from the CATEGORIES tuple. */
type Category = (typeof CATEGORIES)[number];

// ─── Colour palette ───────────────────────────────────────────────────────────

/**
 * COLOR_PALETTE
 * Pastel accent colours assigned deterministically from the subscription name.
 * Used as the tinted background circle on the subscription card icon.
 */
const COLOR_PALETTE = [
  "#ffd6a5", "#b8d4e3", "#e8def8", "#f5c542",
  "#caffbf", "#a0c4ff", "#ffc6ff", "#ffe0b2",
  "#d4f5c0", "#f5d0d0", "#c0d4f5", "#f9c784",
  "#c9b8e8", "#b8e8d4", "#e8c9b8",
];

/**
 * getColorFromName
 * Returns a deterministic pastel colour for a given service name by
 * mapping a djb2-style string hash onto the COLOR_PALETTE index.
 *
 * @param name  Service name (already trimmed)
 * @returns     Hex colour string from COLOR_PALETTE
 */
const getColorFromName = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
};

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * CreateSubscriptionModalProps
 * Accepted by the CreateSubscriptionModal component.
 *
 * @param visible   Controls Modal visibility
 * @param onClose   Called when the user dismisses the sheet (overlay tap or ✕)
 * @param onSubmit  Called with the completed Subscription payload on valid submit
 */
interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (subscription: Subscription) => void;
}

// ─── CreateSubscriptionModal ──────────────────────────────────────────────────

/**
 * CreateSubscriptionModal
 * Bottom-sheet modal for adding a new subscription entry.
 *
 * Internal state tracks the four form fields (name, price, frequency, category).
 * On valid submit, the component assembles the full Subscription object
 * (including logos-api icon URI, computed dates, and a deterministic colour)
 * before passing it to onSubmit and resetting its own state.
 */
const CreateSubscriptionModal = ({
  visible,
  onClose,
  onSubmit,
}: CreateSubscriptionModalProps) => {

  // ── Form state ──────────────────────────────────────────────────────────────

  const [name,      setName]      = useState("");
  const [price,     setPrice]     = useState("");
  const [frequency, setFrequency] = useState<"Weekly" | "Monthly" | "Yearly">("Monthly");
  const [category,  setCategory]  = useState<Category>("Entertainment");

  const posthog     = usePostHog();
  const parsedPrice = parseFloat(price);

  /** True only when the name is non-empty and price is a positive number. */
  const isValid = name.trim().length > 0 && !isNaN(parsedPrice) && parsedPrice > 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * handleClose
   * Resets all form fields to their defaults, then calls the onClose prop.
   * Called by the overlay Pressable and the ✕ button.
   */
  const handleClose = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
    onClose();
  };

  /**
   * handleSubmit
   * Guards against invalid state, builds the Subscription payload, fires a
   * PostHog analytics event, calls onSubmit, then resets field state.
   *
   * Icon URI: constructed from the logos-api using the resolved domain.
   * Dates: startDate = now; renewalDate = now + 1 billing period.
   * Color: deterministic pastel hash of the subscription name.
   */
  const handleSubmit = () => {
    if (!isValid) return;

    const startDate   = dayjs().toISOString();
    const renewalDate = (
      frequency === "Weekly"
        ? dayjs().add(1, "week")
        : frequency === "Monthly"
        ? dayjs().add(1, "month")
        : dayjs().add(1, "year")
    ).toISOString();

    const domain = getDomain(name);
    const icon   = { uri: `https://logos-api.apistemic.com/domain:${domain}` };

    const payload: Subscription = {
      id:            `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      icon,
      name:          name.trim(),
      price:         parsedPrice,
      currency:      "EUR",
      billing:       frequency,
      frequency,
      category,
      status:        "active",
      startDate,
      renewalDate,
      color:         getColorFromName(name.trim()),
    };

    onSubmit(payload);

    posthog.capture("subscription_created", {
      name:      payload.name,
      price:     payload.price,
      frequency: payload.frequency,
      category:  payload.category,
    });

    // Reset form so the sheet is clean the next time it opens.
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
  };

  // ── Sheet content ────────────────────────────────────────────────────────────

  /**
   * sheet
   * The visible sheet content — header row + scrollable form body.
   * Extracted as a local variable so it can be shared between the iOS
   * (KeyboardAvoidingView) and Android (plain View) wrappers below.
   */
  const sheet = (
    <>
      {/* Tap the backdrop to dismiss */}
      <Pressable style={{ flex: 1 }} onPress={handleClose} />

      {/* ── Bottom sheet panel ─────────────────────────────────────────────── */}
      <View className="modal-container">

        {/* ── Header: title + close button ─────────────────────────────────── */}
        <View className="modal-header">
          <Text className="modal-title">New Subscription</Text>
          <Pressable className="modal-close" onPress={handleClose}>
            <Text className="modal-close-text">✕</Text>
          </Pressable>
        </View>

        {/* ── Scrollable form body ──────────────────────────────────────────── */}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="modal-body">

            {/* ── Name field ───────────────────────────────────────────────── */}
            {/*
             * The value here drives getDomain() → logos-api URI.
             * returnKeyType="next" moves focus to the price field on submit.
             */}
            <View className="auth-field">
              <Text className="auth-label">Name</Text>
              <TextInput
                className="auth-input"
                placeholder="e.g. Netflix"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>

            {/* ── Price field ───────────────────────────────────────────────── */}
            <View className="auth-field">
              <Text className="auth-label">Price</Text>
              <TextInput
                className="auth-input"
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>

            {/* ── Frequency picker ──────────────────────────────────────────── */}
            {/*
             * Three-way segmented control.
             * Active option: gold border + gold/10 tint + gold text.
             * Inactive: border-border + muted text.
             */}
            <View className="auth-field">
              <Text className="auth-label">Frequency</Text>
              <View className="picker-row">
                {(["Weekly", "Monthly", "Yearly"] as const).map((opt) => (
                  <Pressable
                    key={opt}
                    className={clsx("picker-option", frequency === opt && "picker-option-active")}
                    onPress={() => setFrequency(opt)}
                  >
                    <Text
                      className={clsx(
                        "picker-option-text",
                        frequency === opt && "picker-option-text-active"
                      )}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Category chips ────────────────────────────────────────────── */}
            {/*
             * Wrapping flex row of pill chips.
             * Active chip: gold border + gold/10 tint + gold text.
             * Inactive: border-border + muted text.
             */}
            <View className="auth-field">
              <Text className="auth-label">Category</Text>
              <View className="category-scroll">
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    className={clsx("category-chip", category === cat && "category-chip-active")}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      className={clsx(
                        "category-chip-text",
                        category === cat && "category-chip-text-active"
                      )}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Submit CTA ────────────────────────────────────────────────── */}
            {/*
             * Disabled (45% opacity gold) until name + valid price are both set.
             */}
            <Pressable
              className={clsx("auth-button", !isValid && "auth-button-disabled")}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Text className="auth-button-text">Add Subscription</Text>
            </Pressable>

            {/* Bottom breathing room so the button clears the safe area */}
            <View className="h-5" />

          </View>
        </ScrollView>
      </View>
    </>
  );

  // ── Platform-aware keyboard handling ────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      {/*
       * iOS: KeyboardAvoidingView with behavior="padding" shifts the sheet
       *      upward so the keyboard never covers the active input.
       * Android: The system keyboard is handled natively; a plain View suffices.
       */}
      {Platform.OS === "ios" ? (
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          behavior="padding"
        >
          {sheet}
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          {sheet}
        </View>
      )}
    </Modal>
  );
};

export default CreateSubscriptionModal;
