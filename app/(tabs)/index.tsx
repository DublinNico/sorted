/**
 * app/(tabs)/index.tsx  —  Home screen
 *
 * Redesigned to match the Figma "High-Fidelity Android UI Mockup".
 *
 * Layout (top → bottom):
 *   1. Header       — greeting text, user name (Clerk), settings shortcut
 *   2. Spending card — gold card showing total monthly cost + trend line
 *   3. Upcoming     — first 3 soonest-renewing subscriptions from the store
 *
 * Icon images use the logos-api (apistemic.com) URI stored on each
 * subscription object.  A local wallet fallback is shown on load error
 * so broken URIs never leave an empty box.
 *
 * The Add Subscription modal is owned by (tabs)/_layout.tsx and opened
 * via the tab-bar FAB — this screen no longer manages it.
 */

import "@/global.css";
import { icons } from "@/constants/icons";
import { colors } from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";
import { useSubscriptionsStore } from "@/store/subscriptionsStore";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── UpcomingRow ──────────────────────────────────────────────────────────────

/**
 * UpcomingRowProps
 * Props consumed by a single upcoming-payment row.
 */
type UpcomingRowProps = {
  subscription: Subscription;
};

/**
 * UpcomingRow
 * Renders one card in the "Upcoming Payments" list.
 *
 * Shows:
 *   - Service logo (from the logos-api URI stored on the subscription)
 *     with a local wallet icon fallback on load error
 *   - Service name + renewal date
 *   - Monthly price on the right
 */
const UpcomingRow = ({ subscription: sub }: UpcomingRowProps) => {
  // Track whether the remote logo failed to load so we can show a fallback.
  const [imgError, setImgError] = useState(false);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* ── Service logo ── */}
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          // Tint the icon background with the subscription's colour at 20% opacity
          backgroundColor: sub.color ? sub.color + "33" : colors.muted,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={imgError ? icons.wallet : sub.icon}
          style={{ width: 32, height: 32, borderRadius: 6 }}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
      </View>

      {/* ── Name + renewal date ── */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 16,
            color: colors.primary,
            fontFamily: "sans-semibold",
            marginBottom: 4,
          }}
        >
          {sub.name}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Ionicons
            name="calendar-outline"
            size={12}
            color={colors.mutedForeground}
          />
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
              fontFamily: "sans-regular",
            }}
          >
            {dayjs(sub.renewalDate).format("MMM D")}
          </Text>
        </View>
      </View>

      {/* ── Price ── */}
      <Text
        style={{
          fontSize: 18,
          color: colors.primary,
          fontFamily: "sans-bold",
        }}
      >
        {formatCurrency(sub.price, sub.currency)}
      </Text>
    </View>
  );
};

// ─── HomeScreen ───────────────────────────────────────────────────────────────

/**
 * HomeScreen
 * Root component for the Home tab.
 *
 * Reads the subscriptions list from Zustand to calculate the monthly total
 * and derive the 3 upcoming renewals shown in the card list.
 * Reads the authenticated user's name from Clerk.
 */
export default function HomeScreen() {
  const { user } = useUser();
  const { subscriptions } = useSubscriptionsStore();
  const router = useRouter();

  // Prefer first name; fall back to email prefix; fall back to "there".
  const displayName =
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "there";

  // Sum all subscription prices for the spending card total.
  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.price, 0);

  // Sort by renewal date ascending and take the first 3.
  const upcomingSubs = [...subscriptions]
    .sort(
      (a, b) =>
        new Date(a.renewalDate ?? 0).getTime() -
        new Date(b.renewalDate ?? 0).getTime()
    )
    .slice(0, 3);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          {/* Left: greeting + user name */}
          <View>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
              }}
            >
              Welcome back,
            </Text>
            <Text
              style={{
                fontSize: 24,
                color: colors.primary,
                fontFamily: "sans-bold",
              }}
            >
              {displayName}
            </Text>
          </View>

          {/* Right: settings icon — taps navigate to the Settings tab */}
          <Pressable
            onPress={() => router.navigate("/(tabs)/settings")}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={colors.primary}
            />
          </Pressable>
        </View>

        {/* ── Monthly Spending card ───────────────────────────────────────── */}
        {/*
         * Gold (#C9A84C) solid background — mirrors the Figma gradient card.
         * All text and icons use colors.background (dark green) for contrast.
         */}
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
          }}
        >
          {/* Top row: card icon + label */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Ionicons
              name="card-outline"
              size={18}
              color={colors.background}
            />
            <Text
              style={{
                fontSize: 14,
                color: colors.background,
                fontFamily: "sans-medium",
              }}
            >
              Monthly Spending
            </Text>
          </View>

          {/* Large total amount */}
          <Text
            style={{
              fontSize: 40,
              color: colors.background,
              fontFamily: "sans-extrabold",
              marginBottom: 16,
            }}
          >
            {formatCurrency(totalMonthly)}
          </Text>

          {/* Trend indicator */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons
              name="trending-up-outline"
              size={16}
              color={colors.background}
            />
            <Text
              style={{
                fontSize: 12,
                color: colors.background,
                fontFamily: "sans-regular",
                opacity: 0.85,
              }}
            >
              +€5.99 from last month
            </Text>
          </View>
        </View>

        {/* ── Upcoming Payments heading ───────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: colors.primary,
              fontFamily: "sans-semibold",
            }}
          >
            Upcoming Payments
          </Text>

          {/* "See all" navigates to the Bills tab */}
          <Pressable
            onPress={() => router.navigate("/(tabs)/subscriptions")}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.accent,
                fontFamily: "sans-medium",
              }}
            >
              See all
            </Text>
          </Pressable>
        </View>

        {/* ── Upcoming payment rows ───────────────────────────────────────── */}
        <View style={{ gap: 10 }}>
          {upcomingSubs.length === 0 ? (
            // Empty state — shown when the store has no subscriptions yet
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "sans-medium",
                paddingVertical: 16,
              }}
            >
              No upcoming renewals yet.
            </Text>
          ) : (
            upcomingSubs.map((sub) => (
              <UpcomingRow key={sub.id} subscription={sub} />
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
