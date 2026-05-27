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
  onEditPress,
  onMarkPaid,
}: SubscriptionCardProps) => {
  // Stable testID slug derived from the subscription name.
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

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
      testID={`subscription-card-${slug}`}
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        ...(expanded ? { borderWidth: 1, borderColor: colors.accent } : {}),
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
            backgroundColor: color ? color + "33" : colors.muted,
            overflow: "hidden",
          }}
        >
          <Image
            source={imgError ? icons.wallet : icon}
            style={{ width: 56, height: 56 }}
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
          {billing === "One-off" ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 999,
                backgroundColor: status === "paid" ? "#22c55e33" : "#f9731633",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: "sans-semibold",
                  color: status === "paid" ? "#22c55e" : "#f97316",
                }}
              >
                {status === "paid" ? "Paid" : "Unpaid"}
              </Text>
            </View>
          ) : (
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
              }}
            >
              {billing}
            </Text>
          )}
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

          {/* Mark as Paid button — only for unpaid one-off bills */}
          {billing === "One-off" && status === "unpaid" && (
            <TouchableOpacity
              onPress={onMarkPaid}
              activeOpacity={0.8}
              style={{
                marginTop: 6,
                backgroundColor: "#22c55e",
                borderRadius: 24,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, color: "#fff", fontFamily: "sans-bold" }}>
                Mark as Paid
              </Text>
            </TouchableOpacity>
          )}

          {/* Edit button — outlined gold */}
          <TouchableOpacity
            onPress={onEditPress}
            activeOpacity={0.8}
            style={{
              marginTop: 6,
              backgroundColor: "transparent",
              borderRadius: 24,
              paddingVertical: 14,
              alignItems: "center",
              borderWidth: 1.5,
              borderColor: colors.accent,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: colors.accent,
                fontFamily: "sans-bold",
              }}
            >
              Edit Payment
            </Text>
          </TouchableOpacity>

          {/* Delete button — muted destructive */}
          <TouchableOpacity
            testID={`subscription-delete-${slug}`}
            onPress={onCancelPress}
            activeOpacity={0.8}
            style={{
              marginTop: 8,
              backgroundColor: colors.destructive + "33",
              borderRadius: 24,
              paddingVertical: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: colors.destructive + "66",
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: colors.destructive,
                fontFamily: "sans-semibold",
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
