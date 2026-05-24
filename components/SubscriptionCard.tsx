/**
 * components/SubscriptionCard.tsx
 *
 * Redesigned to match the Figma "High-Fidelity Android UI Mockup" card style.
 *
 * Collapsed layout (left → right):
 *   [icon circle]  [Name]          [€price]
 *                  [category]      [billing freq]
 *                  [📅 Next: date]
 *
 * Expanded layout: collapsed row + a detail section (payment method,
 * category, start date, renewal date, status) + a red delete button.
 *
 * The service logo is loaded from the logos-api URI stored on the
 * subscription object.  A local wallet icon is shown as fallback if the
 * URI fails to load.
 */

import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import {
  formatCurrency,
  formatStatusLabel,
  formatSubscriptionDateTime,
} from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─── SubscriptionCard ─────────────────────────────────────────────────────────

/**
 * SubscriptionCard
 * A single row in the subscriptions list.
 *
 * Props are spread directly from the Subscription type so all fields
 * defined on the store object are available.
 *
 * @param expanded     Whether the detail section is visible
 * @param onPress      Toggle the expanded state
 * @param onCancelPress Delete this subscription from the store
 */
const SubscriptionCard = ({
  name,
  price,
  currency,
  icon,
  billing,
  color,
  category,
  plan,
  renewalDate,
  expanded,
  paymentMethod,
  startDate,
  status,
  onPress,
  onCancelPress,
}: SubscriptionCardProps) => {

  // Track whether the remote logo URI failed so we can swap in the fallback.
  const [imgError, setImgError] = useState(false);

  // Derive a stable string key from the icon source so the effect dependency
  // comparison works correctly for both local requires (numbers) and URI objects.
  const iconKey = typeof icon === "object" && icon !== null && "uri" in icon
    ? (icon as { uri: string }).uri
    : String(icon);

  // Reset the error flag when the actual icon source changes.
  useEffect(() => {
    setImgError(false);
  }, [iconKey]);

  // Detail rows shown only in the expanded state.
  // Each entry is only rendered when it has a non-empty value.
  const detailRows = [
    { label: "Payment",  value: paymentMethod?.trim() },
    { label: "Category", value: category?.trim() || plan?.trim() },
    { label: "Started",  value: startDate  ? formatSubscriptionDateTime(startDate)  : undefined },
    { label: "Renewal",  value: renewalDate ? formatSubscriptionDateTime(renewalDate) : undefined },
    { label: "Status",   value: status     ? formatStatusLabel(status)              : undefined },
  ];

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.card,           // #0F4D39 always
        borderRadius: 16,
        padding: 16,
        // Gold border highlights the card when it is open
        borderWidth: 1,
        borderColor: expanded ? colors.accent : "transparent",
      }}
    >

      {/* ── Collapsed row ─────────────────────────────────────────────────── */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>

        {/* Service logo — coloured tinted circle using the subscription's colour */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            // Tint background with 20% opacity of the subscription colour
            backgroundColor: color ? color + "33" : colors.muted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Image
            source={imgError ? icons.wallet : icon}
            style={{ width: 36, height: 36, borderRadius: 8 }}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        </View>

        {/* Name, category, and renewal date */}
        <View style={{ flex: 1, minWidth: 0 }}>
          {/* Service name */}
          <Text
            numberOfLines={1}
            style={{
              fontSize: 16,
              color: colors.primary,
              fontFamily: "sans-semibold",
              marginBottom: 2,
            }}
          >
            {name}
          </Text>

          {/* Category or plan label */}
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              fontFamily: "sans-regular",
              marginBottom: 4,
            }}
          >
            {category?.trim() || plan?.trim() || ""}
          </Text>

          {/* Next renewal date — gold calendar icon + date text */}
          {renewalDate ? (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Ionicons
                name="calendar-outline"
                size={12}
                color={colors.accent}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.accent,
                  fontFamily: "sans-medium",
                }}
              >
                Next: {dayjs(renewalDate).format("MMM D")}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Price and billing frequency — right-aligned */}
        <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
          <Text
            style={{
              fontSize: 18,
              color: colors.primary,
              fontFamily: "sans-bold",
              marginBottom: 2,
            }}
          >
            {formatCurrency(price, currency)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              fontFamily: "sans-regular",
            }}
          >
            {billing}
          </Text>
        </View>
      </View>

      {/* ── Expanded detail section ────────────────────────────────────────── */}
      {expanded && (
        <View
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: 10,
          }}
        >
          {/* Detail rows — label on the left, value on the right */}
          {detailRows.map(({ label, value }) =>
            value ? (
              <View
                key={label}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    fontFamily: "sans-medium",
                    flexShrink: 0,
                  }}
                >
                  {label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 14,
                    color: colors.primary,
                    fontFamily: "sans-bold",
                    flex: 1,
                    textAlign: "right",
                  }}
                >
                  {value}
                </Text>
              </View>
            ) : null
          )}

          {/* Delete button — destructive red */}
          <TouchableOpacity
            onPress={onCancelPress}
            activeOpacity={0.8}
            style={{
              marginTop: 6,
              backgroundColor: colors.destructive,
              borderRadius: 24,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: colors.primary,
                fontFamily: "sans-bold",
              }}
            >
              Delete Subscription
            </Text>
          </TouchableOpacity>
        </View>
      )}

    </Pressable>
  );
};

export default SubscriptionCard;
