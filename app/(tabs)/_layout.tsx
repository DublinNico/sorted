/**
 * (tabs)/_layout.tsx
 * Root layout for the (tabs) route group.
 *
 * Renders a custom flat bottom tab bar (matching the Figma design) with:
 *   - Four icon + label tabs: Home, Bills, Insights, Settings
 *   - One elevated gold FAB in the centre that opens the global Add Subscription modal
 *
 * The CreateSubscriptionModal lives here (not on individual screens) so the
 * FAB can open it regardless of which tab is currently active.
 */

import CreateSubscriptionModal from "@/components/CreateSubscriptionModal";
import { colors } from "@/constants/theme";
import { useSubscriptionsStore } from "@/store/subscriptionsStore";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Tab slot definitions ────────────────────────────────────────────────────

/** Describes one of the four navigable tab items. */
type TabItem = {
  routeName: string;
  /** Base Ionicons name — "-outline" suffix is appended when inactive. */
  icon: string;
  label: string;
};

/**
 * TAB_SLOTS
 * Ordered left-to-right layout of the tab bar.
 * `null` marks the centre FAB slot — it has no route and opens the modal.
 */
const TAB_SLOTS: (TabItem | null)[] = [
  { routeName: "index",         icon: "list",      label: "Home"     },
  { routeName: "subscriptions", icon: "calendar",  label: "Bills"    },
  null, // Centre FAB — triggers CreateSubscriptionModal
  { routeName: "insights",      icon: "pie-chart", label: "Insights" },
  { routeName: "settings",      icon: "settings",  label: "Settings" },
];

// ─── CustomTabBar ─────────────────────────────────────────────────────────────

/** Props extend the standard React Navigation tab bar props with a FAB callback. */
type CustomTabBarProps = BottomTabBarProps & {
  /** Called when the user taps the centre FAB. */
  onAddPress: () => void;
};

/**
 * CustomTabBar
 * Flat bottom navigation bar matching the Figma "High-Fidelity Android UI Mockup".
 *
 * Layout (left → right):
 *   Home | Bills | [FAB] | Insights | Settings
 *
 * Active tab: gold icon + gold label + semibold weight.
 * Inactive tab: muted-cream icon + muted-cream label + medium weight.
 * FAB: 56×56 gold circle, elevated 20px above the bar via negative marginTop.
 */
const CustomTabBar = ({ state, navigation, onAddPress }: CustomTabBarProps) => {
  const insets = useSafeAreaInsets();

  // Name of the currently active route — used to determine the focused tab.
  const activeRouteName = state.routes[state.index]?.name;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: colors.card,          // #0F4D39 medium green
        borderTopWidth: 1,
        borderTopColor: colors.border,          // Subtle cream border
        paddingBottom: Math.max(insets.bottom, 8),
        overflow: "visible",                    // Lets the FAB render above the bar
      }}
    >
      {TAB_SLOTS.map((slot, index) => {
        // ── Centre FAB ──────────────────────────────────────────────────────
        if (slot === null) {
          return (
            <View key="fab" style={{ flex: 1, alignItems: "center" }}>
              {/*
               * marginTop: -20 pops the button above the bar's top edge.
               * shadow / elevation gives the gold glow effect.
               */}
              <Pressable
                onPress={onAddPress}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.accent,  // Gold #C9A84C
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: -20,
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.4,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Ionicons name="add" size={28} color={colors.background} />
              </Pressable>
            </View>
          );
        }

        // ── Regular tab item ─────────────────────────────────────────────────
        const focused   = activeRouteName === slot.routeName;
        const iconColor = focused ? colors.accent : colors.mutedForeground;

        // Ionicons convention: solid name when focused, outline when not.
        const iconName = (
          focused ? slot.icon : `${slot.icon}-outline`
        ) as React.ComponentProps<typeof Ionicons>["name"];

        return (
          <Pressable
            key={slot.routeName}
            onPress={() => navigation.navigate(slot.routeName)}
            style={{
              flex: 1,
              alignItems: "center",
              paddingTop: 10,
              paddingBottom: 4,
              gap: 3,
            }}
          >
            <Ionicons name={iconName} size={22} color={iconColor} />
            <Text
              style={{
                fontSize: 11,
                color: iconColor,
                fontFamily: focused ? "sans-semibold" : "sans-medium",
              }}
            >
              {slot.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

// ─── TabLayout ────────────────────────────────────────────────────────────────

/**
 * TabLayout
 * Configures the Expo Router <Tabs> navigator with the custom tab bar.
 * Also owns the global CreateSubscriptionModal so the FAB can open it
 * from any tab without each screen managing its own modal state.
 */
const TabLayout = () => {
  // Controls visibility of the Add Subscription bottom sheet.
  const [modalVisible, setModalVisible] = useState(false);

  const { addSubscription } = useSubscriptionsStore();

  /**
   * handleAddSubscription
   * Persists the new subscription to the Zustand store and dismisses the modal.
   */
  const handleAddSubscription = (subscription: Subscription) => {
    addSubscription(subscription);
    setModalVisible(false);
  };

  return (
    <>
      {/* ── Navigator ──────────────────────────────────────────────────────── */}
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => (
          <CustomTabBar {...props} onAddPress={() => setModalVisible(true)} />
        )}
      >
        <Tabs.Screen name="index"         options={{ title: "Home"     }} />
        <Tabs.Screen name="subscriptions" options={{ title: "Bills"    }} />
        <Tabs.Screen name="insights"      options={{ title: "Insights" }} />
        <Tabs.Screen name="settings"      options={{ title: "Settings" }} />

        {/* The [id] detail screen exists as a route but should not appear in the bar. */}
        <Tabs.Screen name="subscriptions/[id]" options={{ href: null }} />
      </Tabs>

      {/* ── Global Add Subscription modal ──────────────────────────────────── */}
      {/* Mounted here so the FAB in CustomTabBar can toggle it from any tab.  */}
      <CreateSubscriptionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddSubscription}
      />
    </>
  );
};

export default TabLayout;
