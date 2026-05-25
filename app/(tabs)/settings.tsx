/**
 * app/(tabs)/settings.tsx  —  Settings screen
 *
 * Redesigned to match the Figma "High-Fidelity Android UI Mockup".
 *
 * Layout (top → bottom):
 *   1. Title             — "Settings"
 *   2. Profile card      — gold initials avatar, full name, email, chevron
 *   3. Settings list     — icon rows for Profile, Notifications, Payment
 *                          Methods, Security, Help & Support
 *   4. App info card     — Version, Active Payments, Total Monthly Cost
 *   5. Sign Out button   — destructive style, calls Clerk signOut()
 *
 * User identity (name, email) is read from Clerk's useUser hook.
 * Subscription counts and totals are read from the Zustand store.
 * App version is read from the Expo config via expo-constants.
 */

import "@/global.css";
import { colors } from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";
import { useSubscriptionsStore } from "@/store/subscriptionsStore";
import { useClerk, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Settings item definitions ────────────────────────────────────────────────

/**
 * SettingsItem
 * Metadata for a single tappable row in the settings list.
 * `route` is optional — only rows with a built screen have a route defined.
 */
type SettingsItem = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  description: string;
  /** Typed as a literal union — add entries here as screens are built. */
  route?: "/profile" | "/notifications" | "/payment-methods";
};

/**
 * SETTINGS_ITEMS
 * Ordered list of settings rows shown between the profile card and app info.
 * Rows without a `route` are non-functional placeholders until their screens
 * are built.
 */
const SETTINGS_ITEMS: SettingsItem[] = [
  { icon: "person-outline",            label: "Profile",          description: "Manage your account",  route: "/profile" },
  { icon: "notifications-outline",     label: "Notifications",    description: "Billing reminders",   route: "/notifications" },
  { icon: "card-outline",              label: "Payment Methods",  description: "Manage cards",         route: "/payment-methods" },
  { icon: "shield-checkmark-outline",  label: "Security",         description: "Password & privacy"   },
  { icon: "help-circle-outline",       label: "Help & Support",   description: "Get assistance"       },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * getInitials
 * Derives a 1–2 character initials string from the user object.
 * Priority: firstName + lastName → firstName only → email prefix → "?"
 */
const getInitials = (
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string => {
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName)             return firstName[0].toUpperCase();
  if (email)                 return email[0].toUpperCase();
  return "?";
};

// ─── Settings screen ──────────────────────────────────────────────────────────

/**
 * Settings
 * Root component for the Settings tab.
 */
const Settings = () => {
  const { user }          = useUser();
  const { signOut }       = useClerk();
  const { subscriptions } = useSubscriptionsStore();
  const router            = useRouter();

  // ── Derived values ──────────────────────────────────────────────────────────

  /** Display name — full name if available, otherwise email prefix. */
  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "User";

  /** Primary email address. */
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  /** Two-letter initials for the gold avatar circle. */
  const initials = getInitials(user?.firstName, user?.lastName, email);

  /** Sum of all subscription prices. */
  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.price, 0);

  /** App version from expo config (app.json). */
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      >

        {/* ── Title ──────────────────────────────────────────────────────── */}
        <Text
          style={{
            fontSize: 24,
            color: colors.primary,
            fontFamily: "sans-bold",
            marginBottom: 20,
          }}
        >
          Settings
        </Text>

        {/* ── Profile card ───────────────────────────────────────────────── */}
        {/*
         * Shows the authenticated user's avatar (gold circle with initials),
         * display name, and email.  Tapping navigates to the Profile screen.
         */}
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            marginBottom: 16,
          }}
        >
          {/* Gold circle avatar with user initials */}
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 22,
                color: colors.background,
                fontFamily: "sans-extrabold",
              }}
            >
              {initials}
            </Text>
          </View>

          {/* Name and email */}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 18,
                color: colors.primary,
                fontFamily: "sans-bold",
                marginBottom: 2,
              }}
            >
              {displayName}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 13,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
              }}
            >
              {email}
            </Text>
          </View>

          {/* Chevron — indicates the card is tappable */}
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.accent}
          />
        </TouchableOpacity>

        {/* ── Settings items list ─────────────────────────────────────────── */}
        {/*
         * Each row has a gold-tinted icon square, a label + description,
         * and a muted chevron on the right.
         * Rows with a `route` navigate on press; others are placeholders
         * until their sub-screens are built.
         */}
        <View style={{ gap: 10, marginBottom: 16 }}>
          {SETTINGS_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.label}
              activeOpacity={item.route ? 0.7 : 1}
              onPress={item.route ? () => router.push(item.route!) : undefined}
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
              }}
            >
              {/* Gold-tinted icon square */}
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  backgroundColor: colors.accent + "20",  // 12% opacity gold
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={item.icon} size={22} color={colors.accent} />
              </View>

              {/* Label + description */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.primary,
                    fontFamily: "sans-semibold",
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    fontFamily: "sans-regular",
                  }}
                >
                  {item.description}
                </Text>
              </View>

              {/* Muted chevron */}
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.mutedForeground}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── App info card ───────────────────────────────────────────────── */}
        {/*
         * Three read-only rows separated by hairline dividers.
         * "Total Monthly Cost" uses the gold accent colour to match the Figma.
         */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 18,
            paddingHorizontal: 16,
            marginBottom: 16,
            overflow: "hidden",
          }}
        >
          {/* Version */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
              }}
            >
              Version
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
                fontFamily: "sans-medium",
              }}
            >
              {appVersion}
            </Text>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Active Payments count */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
              }}
            >
              Active Payments
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
                fontFamily: "sans-medium",
              }}
            >
              {subscriptions.length}
            </Text>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: colors.border }} />

          {/* Total monthly cost — gold to draw the eye */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 14,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
              }}
            >
              Total Monthly Cost
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.accent,
                fontFamily: "sans-semibold",
              }}
            >
              {formatCurrency(totalMonthly)}
            </Text>
          </View>
        </View>

        {/* ── Sign Out button ─────────────────────────────────────────────── */}
        {/*
         * Subtle destructive style: card background with a faint red border
         * and red text/icon — matches the Figma treatment.
         * Calls Clerk's signOut() which redirects to the auth flow.
         */}
        <TouchableOpacity
          onPress={() => signOut()}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.destructive + "40",  // 25% opacity red border
            borderRadius: 18,
            paddingVertical: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.destructive} />
          <Text
            style={{
              fontSize: 16,
              color: colors.destructive,
              fontFamily: "sans-semibold",
            }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>

        {/* ── Dev-only: splash screen preview ────────────────────────────── */}
        {__DEV__ && (
          <TouchableOpacity
            onPress={() => router.push("/splash-preview")}
            activeOpacity={0.8}
            style={{
              marginTop: 10,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.accent + "40",
              borderRadius: 18,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Ionicons name="phone-portrait-outline" size={20} color={colors.accent} />
            <Text style={{ fontSize: 16, color: colors.accent, fontFamily: "sans-semibold" }}>
              Preview Splash
            </Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;
