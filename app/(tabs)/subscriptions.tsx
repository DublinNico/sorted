/**
 * app/(tabs)/subscriptions.tsx  —  Bills / All Payments screen
 *
 * Redesigned to match the Figma "High-Fidelity Android UI Mockup".
 *
 * Layout (top → bottom):
 *   1. Title          — "All Payments"
 *   2. Search bar     — filters by name, category, or plan
 *   3. Category chips — horizontal scroll; derived dynamically from the store
 *   4. Count + total  — "N payments" on the left, total on the right
 *   5. Card list      — filtered SubscriptionCards (expandable)
 *
 * All data comes from the Zustand subscriptions store.
 * The Add Subscription modal is owned by (tabs)/_layout.tsx.
 */

import "@/global.css";
import SubscriptionCard from "@/components/SubscriptionCard";
import { colors } from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";
import { useSubscriptionsStore } from "@/store/subscriptionsStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Subscriptions screen ─────────────────────────────────────────────────────

/**
 * Subscriptions
 * Renders the Bills tab — a searchable, filterable list of all subscriptions.
 */
const Subscriptions = () => {
  const { subscriptions, deleteSubscription } = useSubscriptionsStore();

  // Search query typed into the input field.
  const [query, setQuery] = useState("");

  // The currently selected category pill; "All" shows every subscription.
  const [selectedCategory, setSelectedCategory] = useState("All");

  // ID of the currently expanded card; null means all are collapsed.
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Derived data ────────────────────────────────────────────────────────────

  /**
   * categories
   * Unique category names pulled from the store, prepended with "All".
   * Re-computed only when the subscriptions array changes.
   */
  const categories = useMemo(() => {
    const cats = subscriptions
      .map((s) => s.category?.trim() || s.plan?.trim())
      .filter((c): c is string => !!c && c.length > 0);
    return ["All", ...Array.from(new Set(cats))];
  }, [subscriptions]);

  /**
   * filtered
   * Subscriptions that match both the search query and the selected category.
   */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subscriptions.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.category?.toLowerCase().includes(q) ||
        s.plan?.toLowerCase().includes(q);
      const catOrPlan = s.category?.trim() || s.plan?.trim();
      const matchesCategory =
        selectedCategory === "All" || catOrPlan === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [subscriptions, query, selectedCategory]);

  /**
   * totalFiltered
   * Sum of the prices of all currently visible subscriptions.
   */
  const totalFiltered = filtered.reduce((sum, s) => sum + s.price, 0);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          // ── List header — title, search, filters, summary ────────────────
          ListHeaderComponent={
            <View style={{ paddingTop: 24 }}>

              {/* Title */}
              <Text
                style={{
                  fontSize: 24,
                  color: colors.primary,
                  fontFamily: "sans-bold",
                  marginBottom: 16,
                }}
              >
                All Payments
              </Text>

              {/* ── Search bar ──────────────────────────────────────────── */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.card,
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  marginBottom: 14,
                  gap: 10,
                }}
              >
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={colors.mutedForeground}
                />
                <TextInput
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: colors.primary,
                    fontFamily: "sans-regular",
                  }}
                  placeholder="Search payments..."
                  placeholderTextColor={colors.mutedForeground}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* ── Category filter chips ────────────────────────────────── */}
              {/*
               * Horizontal scroll of pill-shaped toggle buttons.
               * Active chip: gold background + dark green text.
               * Inactive chip: card (#0F4D39) background + cream text.
               */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
                style={{ marginBottom: 16 }}
              >
                {categories.map((cat) => {
                  const active = selectedCategory === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 999,
                        backgroundColor: active
                          ? colors.accent       // Gold when selected
                          : colors.card,        // Medium green when idle
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontFamily: active ? "sans-semibold" : "sans-regular",
                          color: active
                            ? colors.background  // Dark green text on gold
                            : colors.primary,    // Cream text on green
                        }}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* ── Count + total summary row ────────────────────────────── */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                {/* Number of visible payments */}
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                    fontFamily: "sans-regular",
                  }}
                >
                  {filtered.length} payment{filtered.length !== 1 ? "s" : ""}
                </Text>

                {/* Total cost of visible payments */}
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.accent,
                    fontFamily: "sans-semibold",
                  }}
                >
                  {formatCurrency(totalFiltered)}/mo
                </Text>
              </View>
            </View>
          }

          // ── Subscription card rows ─────────────────────────────────────
          data={filtered}
          keyExtractor={(item: Subscription) => item.id}
          renderItem={({ item }: { item: Subscription }) => (
            <SubscriptionCard
              {...item}
              expanded={expandedId === item.id}
              onPress={() =>
                // Toggle: collapse if already open, otherwise expand this card.
                setExpandedId((current) =>
                  current === item.id ? null : item.id
                )
              }
              onCancelPress={() => {
                deleteSubscription(item.id);
                setExpandedId(null);
              }}
            />
          )}
          extraData={expandedId}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "sans-medium",
                paddingVertical: 16,
                paddingHorizontal: 24,
              }}
            >
              No payments found.
            </Text>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Subscriptions;
