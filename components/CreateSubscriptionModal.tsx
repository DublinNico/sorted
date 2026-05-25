/**
 * components/CreateSubscriptionModal.tsx  —  Add Payment bottom sheet
 *
 * Redesigned to match the Figma "High-Fidelity Android UI Mockup" modal.
 *
 * Layout (top → bottom inside the sheet):
 *   1. Header row         — "New Payment" title + circular close button
 *   2. Payment Type       — dropdown selector from PAYMENT_TYPES list
 *   3. Name               — free-text for the specific provider/service name
 *   4. Amount (€)         — numeric decimal-pad input
 *   5. Billing Cycle      — dropdown (Weekly / Monthly / Yearly)
 *   6. Next Payment Date  — text input in dd/mm/yyyy format with calendar icon
 *   7. Submit CTA         — gold "Add Payment" button (disabled when incomplete)
 *
 * On submit the component:
 *   • uses the Name field to derive the logos-api icon domain
 *   • builds a logos-api URI for the service icon
 *   • assigns a deterministic colour from COLOR_PALETTE via a name hash
 *   • uses the Next Payment Date as renewalDate; startDate = today
 *   • derives category automatically from the selected payment type
 *   • fires a PostHog "subscription_created" event
 *   • calls the onSubmit prop with the completed Subscription payload
 *
 * The sheet sits on a 50%-opacity black overlay.  Tapping the overlay calls
 * onClose.  On iOS a KeyboardAvoidingView pushes the sheet above the keyboard.
 *
 * All theme colours come from the NativeWind classes defined in global.css
 * (modal-container, auth-input, etc.) — no hardcoded hex values except where
 * a prop is required by a React Native core component (e.g. placeholderTextColor).
 */

import "@/global.css";
import CalendarPicker from "@/components/CalendarPicker";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
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
  TouchableOpacity,
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

// ─── Payment types ────────────────────────────────────────────────────────────

/**
 * PAYMENT_TYPES
 * Ordered list of selectable payment types shown in the dropdown.
 * Utilities appear first per design spec.
 */
const PAYMENT_TYPES = [
  "Rent / Housing",
  "Utility - Electricity",
  "Utility - Water",
  "Utility - Gas",
  "Utility - Internet",
  "Utility - Phone",
  "Utility - Waste Disposal",
  "Utility - Other",
  "Subscription - Entertainment",
  "Subscription - Productivity",
  "Subscription - Other",
] as const;

/** Union type derived from the PAYMENT_TYPES tuple. */
type PaymentType = (typeof PAYMENT_TYPES)[number];

/** Default selection — first item in the list (Rent / Housing). */
const DEFAULT_PAYMENT_TYPE: PaymentType = PAYMENT_TYPES[0];

// ─── Category list ────────────────────────────────────────────────────────────

/**
 * CATEGORIES
 * Ordered list of categories shown as chip selectors.
 * Includes Utilities and Housing to cover the payment types above.
 */
const CATEGORIES = [
  "Utilities",
  "Housing",
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

/**
 * PAYMENT_TYPE_CATEGORY
 * Maps each payment type to its implied category so the category chip
 * auto-selects when the user picks a payment type.
 * The user can still tap a different chip to override the auto-selection.
 */
const PAYMENT_TYPE_CATEGORY: Record<PaymentType, Category> = {
  "Utility - Electricity":   "Utilities",
  "Utility - Water":         "Utilities",
  "Utility - Gas":           "Utilities",
  "Utility - Internet":      "Utilities",
  "Utility - Phone":         "Utilities",
  "Utility - Waste Disposal":"Utilities",
  "Utility - Other":         "Utilities",
  "Subscription - Entertainment": "Entertainment",
  "Subscription - Productivity":  "Productivity",
  "Subscription - Other":         "Other",
  "Rent / Housing":               "Housing",
};

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
 * Bottom-sheet modal for adding a new payment entry.
 *
 * Form fields: Payment Type (dropdown), Name (free-text), Amount (€),
 * Billing Cycle (dropdown), Next Payment Date (dd/mm/yyyy text input).
 * Category is auto-derived from the selected payment type.
 */
const CreateSubscriptionModal = ({
  visible,
  onClose,
  onSubmit,
}: CreateSubscriptionModalProps) => {

  // ── Form state ──────────────────────────────────────────────────────────────

  const [paymentType,      setPaymentType]      = useState<PaymentType>(DEFAULT_PAYMENT_TYPE);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [name,             setName]             = useState("");
  const [price,            setPrice]            = useState("");
  const [billing,          setBilling]          = useState<"Weekly" | "Monthly" | "Yearly">("Monthly");
  const [showBillingDrop,  setShowBillingDrop]  = useState(false);
  const [nextPaymentDate,  setNextPaymentDate]  = useState("");
  const [showCalendar,     setShowCalendar]     = useState(false);

  const posthog     = usePostHog();
  const parsedPrice = parseFloat(price);

  /** True when name is filled and price is a positive number. */
  const isValid = name.trim().length > 0 && !isNaN(parsedPrice) && parsedPrice > 0;

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * formatDateInput
   * Auto-inserts "/" separators so the field shows dd/mm/yyyy as the user types.
   */
  const formatDateInput = (raw: string): string => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  /**
   * parseDateInput
   * Converts a dd/mm/yyyy string to a dayjs object.
   * Falls back to billing-cycle offset from today if the input is incomplete.
   */
  const parseDateInput = (dateStr: string): dayjs.Dayjs => {
    const parts = dateStr.split("/");
    if (parts.length === 3 && parts[2].length === 4) {
      const parsed = dayjs(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (parsed.isValid()) return parsed;
    }
    return billing === "Weekly"
      ? dayjs().add(1, "week")
      : billing === "Monthly"
      ? dayjs().add(1, "month")
      : dayjs().add(1, "year");
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  /**
   * handleClose
   * Resets all form fields to their defaults, then calls the onClose prop.
   */
  const handleClose = () => {
    setPaymentType(DEFAULT_PAYMENT_TYPE);
    setShowTypeDropdown(false);
    setName("");
    setPrice("");
    setBilling("Monthly");
    setShowBillingDrop(false);
    setNextPaymentDate("");
    setShowCalendar(false);
    onClose();
  };

  /**
   * handleSelectPaymentType
   * Sets the payment type and collapses the type dropdown.
   */
  const handleSelectPaymentType = (type: PaymentType) => {
    setPaymentType(type);
    setShowTypeDropdown(false);
  };

  /**
   * handleSubmit
   * Builds the Subscription payload, fires PostHog event, calls onSubmit,
   * then resets state.
   *
   * Icon:     logos-api URI from the Name field via getDomain().
   * Category: auto-derived from the selected payment type.
   * Dates:    startDate = today; renewalDate from the date field (or computed).
   */
  const handleSubmit = () => {
    if (!isValid) return;

    const trimmedName = name.trim();
    const startDate   = dayjs().toISOString();
    const renewalDate = parseDateInput(nextPaymentDate).toISOString();
    const domain      = getDomain(trimmedName);
    const icon        = { uri: `https://logos-api.apistemic.com/domain:${domain}` };
    const category    = PAYMENT_TYPE_CATEGORY[paymentType];

    const payload: Subscription = {
      id:        `${trimmedName.toLowerCase().replace(/[\s/]+/g, "-")}-${Date.now()}`,
      icon,
      name:      trimmedName,
      price:     parsedPrice,
      currency:  "EUR",
      billing,
      frequency: billing,
      category,
      status:    "active",
      startDate,
      renewalDate,
      color:     getColorFromName(trimmedName),
    };

    onSubmit(payload);

    posthog.capture("subscription_created", {
      name:      payload.name,
      price:     payload.price,
      frequency: payload.frequency ?? null,
      category:  payload.category ?? null,
    });

    // Reset for next use.
    setPaymentType(DEFAULT_PAYMENT_TYPE);
    setShowTypeDropdown(false);
    setName("");
    setPrice("");
    setBilling("Monthly");
    setShowBillingDrop(false);
    setNextPaymentDate("");
    setShowCalendar(false);
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
          <Text className="modal-title">New Payment</Text>
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

            {/* ── Payment Type dropdown ─────────────────────────────────────── */}
            {/*
             * Tapping the trigger toggles the inline options list.
             * Selecting an option collapses the list and auto-sets the category.
             */}
            <View className="auth-field">
              <Text className="auth-label">Payment Type</Text>

              {/* Trigger row */}
              <TouchableOpacity
                onPress={() => { setShowTypeDropdown((v) => !v); setShowBillingDrop(false); }}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.background,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: showTypeDropdown ? colors.accent : colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "sans-medium", flex: 1 }}>
                  {paymentType}
                </Text>
                <Ionicons name={showTypeDropdown ? "chevron-up" : "chevron-down"} size={18} color={colors.accent} />
              </TouchableOpacity>

              {/* Inline options list */}
              {showTypeDropdown && (
                <View style={{ backgroundColor: colors.background, borderRadius: 14, borderWidth: 1, borderColor: colors.accent, overflow: "hidden", marginTop: 4 }}>
                  {PAYMENT_TYPES.map((type, index) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => handleSelectPaymentType(type)}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        backgroundColor: type === paymentType ? colors.accent + "20" : "transparent",
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: type === paymentType ? colors.accent : colors.primary, fontFamily: type === paymentType ? "sans-semibold" : "sans-regular" }}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ── Name field ────────────────────────────────────────────────── */}
            {/*
             * Specific provider or service name (e.g. "Spotify", "ESB", "Rent").
             * Drives getDomain() → logos-api icon URI lookup.
             */}
            <View className="auth-field">
              <Text className="auth-label">Name</Text>
              <TextInput
                className="auth-input"
                placeholder="e.g., Spotify, Electricity, Rent"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                returnKeyType="next"
              />
            </View>

            {/* ── Amount field ──────────────────────────────────────────────── */}
            <View className="auth-field">
              <Text className="auth-label">Amount (€)</Text>
              <TextInput
                className="auth-input"
                placeholder="9.99"
                placeholderTextColor={colors.mutedForeground}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>

            {/* ── Billing Cycle dropdown ────────────────────────────────────── */}
            {/* Same dropdown pattern as Payment Type. */}
            <View className="auth-field">
              <Text className="auth-label">Billing Cycle</Text>

              {/* Trigger row */}
              <TouchableOpacity
                onPress={() => { setShowBillingDrop((v) => !v); setShowTypeDropdown(false); }}
                activeOpacity={0.8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: colors.background,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: showBillingDrop ? colors.accent : colors.border,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                }}
              >
                <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "sans-medium", flex: 1 }}>
                  {billing}
                </Text>
                <Ionicons name={showBillingDrop ? "chevron-up" : "chevron-down"} size={18} color={colors.accent} />
              </TouchableOpacity>

              {/* Inline options list */}
              {showBillingDrop && (
                <View style={{ backgroundColor: colors.background, borderRadius: 14, borderWidth: 1, borderColor: colors.accent, overflow: "hidden", marginTop: 4 }}>
                  {(["Weekly", "Monthly", "Yearly"] as const).map((opt, index) => (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => { setBilling(opt); setShowBillingDrop(false); }}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 13,
                        backgroundColor: opt === billing ? colors.accent + "20" : "transparent",
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: opt === billing ? colors.accent : colors.primary, fontFamily: opt === billing ? "sans-semibold" : "sans-regular" }}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ── Next Payment Date ─────────────────────────────────────────── */}
            {/*
             * Text input auto-formats to dd/mm/yyyy as the user types.
             * Tapping the calendar icon opens the CalendarPicker popup modal.
             * If left blank, renewalDate falls back to today + 1 billing period.
             */}
            <View className="auth-field">
              <Text className="auth-label">Next Payment Date</Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  className="auth-input"
                  placeholder="dd/mm/yyyy"
                  placeholderTextColor={colors.mutedForeground}
                  value={nextPaymentDate}
                  onChangeText={(v) => setNextPaymentDate(formatDateInput(v))}
                  keyboardType="number-pad"
                  returnKeyType="done"
                  maxLength={10}
                  style={{ paddingRight: 48 }}
                />
                {/* Tapping the calendar icon opens the date picker popup */}
                <TouchableOpacity
                  onPress={() => setShowCalendar(true)}
                  hitSlop={8}
                  style={{ position: "absolute", right: 16, top: 0, bottom: 0, justifyContent: "center" }}
                >
                  <Ionicons name="calendar-outline" size={20} color={colors.accent} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Submit CTA ────────────────────────────────────────────────── */}
            {/* Disabled (45% opacity gold) until name + valid price are both set. */}
            <Pressable
              className={clsx("auth-button", !isValid && "auth-button-disabled")}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Text className="auth-button-text">Add Payment</Text>
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
    <>
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

      {/* Calendar picker — rendered as a separate Modal so it layers above the sheet */}
      <CalendarPicker
        visible={showCalendar}
        value={nextPaymentDate}
        onSelect={(date) => setNextPaymentDate(date)}
        onClose={() => setShowCalendar(false)}
      />
    </>
  );
};

export default CreateSubscriptionModal;
