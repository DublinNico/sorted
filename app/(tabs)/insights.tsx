/**
 * app/(tabs)/insights.tsx  —  Insights screen
 *
 * Redesigned to match the Figma "High-Fidelity Android UI Mockup".
 *
 * Layout (top → bottom):
 *   1. Title                — "Insights"
 *   2. Total Spending card  — gold card with live total + trend badge
 *   3. Spending Trend       — custom View-based bar chart (last 5 months)
 *   4. Category Breakdown   — segmented bar + legend list, derived from store
 *
 * No external chart library is used — all visuals are built with core
 * React Native View/Text primitives so no new dependencies are required.
 *
 * Live data (total, category breakdown) is read from the Zustand store.
 * Historical trend data uses static mock values since the app does not
 * yet persist month-over-month spending history.
 */

import "@/global.css";
import { colors } from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";
import { useSubscriptionsStore } from "@/store/subscriptionsStore";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * CATEGORY_COLORS
 * Fixed colour map for known subscription categories.
 * Unknown categories fall back to a neutral grey.
 */
const CATEGORY_COLORS: Record<string, string> = {
  Entertainment:     "#1DB954",
  "AI Tools":        "#4B8BFF",
  "Developer Tools": "#E06C75",
  Design:            "#C9A84C",
  Productivity:      "#FF6347",
  Cloud:             "#87CEEB",
  Music:             "#9B59B6",
  Housing:           "#8B4513",
  Utilities:         "#FFD700",
  Other:             "#7F8C8D",
};

/**
 * TREND_DATA
 * Static monthly spending values used for the bar chart.
 * The app does not yet persist historical totals, so these mock the
 * previous four months while the current month is derived from the store.
 */
const TREND_DATA_STATIC = [
  { month: "Jan", amount: 1200 },
  { month: "Feb", amount: 1350 },
  { month: "Mar", amount: 1180 },
  { month: "Apr", amount: 1450 },
];

// Height (px) of the bar chart drawing area — bars grow up from this baseline.
const BAR_CHART_HEIGHT = 140;

// ─── SpendingTrendChart ───────────────────────────────────────────────────────

/**
 * SpendingTrendChart
 * Custom bar chart built entirely from View components.
 *
 * Each bar's pixel height is proportional to its value relative to the
 * maximum value in the dataset.  The current month's bar is rendered in
 * full gold; prior months use a 50 % opacity gold.
 *
 * @param data  Array of { month, amount } objects (oldest → newest)
 */
const SpendingTrendChart = ({ data }: { data: { month: string; amount: number }[] }) => {
  const maxAmount = Math.max(...data.map((d) => d.amount));

  return (
    <View>
      {/* ── Bar columns ── */}
      <View
        style={{
          height: BAR_CHART_HEIGHT,
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {data.map((d, i) => {
          // Ensure very small values still show a minimum visible bar height.
          const barHeight = Math.max(8, (d.amount / maxAmount) * (BAR_CHART_HEIGHT - 8));
          const isLatest = i === data.length - 1;

          return (
            <View
              key={`bar-${i}`}
              style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}
            >
              <View
                style={{
                  width: "65%",
                  height: barHeight,
                  // Current month: full gold. Previous months: 50% opacity.
                  backgroundColor: isLatest ? colors.accent : colors.accent + "80",
                  borderTopLeftRadius: 6,
                  borderTopRightRadius: 6,
                }}
              />
            </View>
          );
        })}
      </View>

      {/* ── Month labels beneath each bar ── */}
      <View style={{ flexDirection: "row", marginTop: 8 }}>
        {data.map((d, i) => (
          <View key={`label-${i}`} style={{ flex: 1, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
              }}
            >
              {d.month}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// ─── CategoryBreakdown ────────────────────────────────────────────────────────

/**
 * CategoryBreakdownProps
 * A single category entry used by the breakdown section.
 */
type CategoryEntry = {
  name: string;
  value: number;
  percent: number;
  color: string;
};

/**
 * CategoryBreakdown
 * Renders:
 *   1. A segmented horizontal bar — each colour segment is proportional
 *      to that category's share of total spending.
 *   2. A legend list — colour dot, category name, amount, and percentage.
 *
 * @param data   Sorted array of category entries (highest value first)
 */
const CategoryBreakdown = ({ data }: { data: CategoryEntry[] }) => (
  <View style={{ gap: 16 }}>

    {/* ── Segmented bar ── */}
    {/*
     * Each segment's flex value equals its proportion of the total,
     * so segments automatically fill the full bar width.
     * overflow: hidden + borderRadius clip the rounded ends.
     */}
    <View
      style={{
        flexDirection: "row",
        height: 10,
        borderRadius: 5,
        overflow: "hidden",
        gap: 2,
      }}
    >
      {data.map((cat) => (
        <View
          key={cat.name}
          style={{
            flex: cat.value,   // proportional width
            backgroundColor: cat.color,
          }}
        />
      ))}
    </View>

    {/* ── Legend list ── */}
    <View style={{ gap: 12 }}>
      {data.map((cat) => (
        <View
          key={cat.name}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left: colour dot + category name */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: cat.color,
              }}
            />
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
                fontFamily: "sans-regular",
              }}
            >
              {cat.name}
            </Text>
          </View>

          {/* Right: amount + percentage */}
          <View style={{ alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 14,
                color: colors.primary,
                fontFamily: "sans-semibold",
              }}
            >
              {formatCurrency(cat.value)}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
              }}
            >
              {cat.percent.toFixed(1)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  </View>
);

// ─── InsightsScreen ───────────────────────────────────────────────────────────

/**
 * InsightsScreen
 * Root component for the Insights tab.
 *
 * Derives the current month's total and category breakdown from the Zustand
 * subscriptions store, then appends the live total to the static trend data
 * so the rightmost bar always reflects real spending.
 */
const InsightsScreen = () => {
  const { subscriptions } = useSubscriptionsStore();

  // ── Derived values ──────────────────────────────────────────────────────────

  /** Total of all subscription prices. */
  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.price, 0);

  /** Percentage change vs the most recent static month (prev month proxy). */
  const prevMonthAmount = TREND_DATA_STATIC[TREND_DATA_STATIC.length - 1].amount;
  const trendPercent = prevMonthAmount > 0
    ? ((totalMonthly - prevMonthAmount) / prevMonthAmount) * 100
    : 0;
  const trendLabel = `${trendPercent >= 0 ? "+" : ""}${trendPercent.toFixed(0)}% vs last month`;

  /**
   * trendData
   * Static prior-month figures + the live current-month total as the last bar.
   * Re-computed when the store changes so the current bar stays in sync.
   */
  const trendData = useMemo(() => {
    const now = new Date();
    const currentMonthLabel = now.toLocaleString("default", { month: "short" });
    return [
      ...TREND_DATA_STATIC,
      { month: currentMonthLabel, amount: totalMonthly },
    ];
  }, [totalMonthly]);

  /**
   * categoryData
   * Groups subscriptions by category, sums their prices, and computes
   * each category's percentage of total spending.
   * Sorted highest-value first so the legend reads top-to-bottom by spend.
   */
  const categoryData: CategoryEntry[] = useMemo(() => {
    const map: Record<string, number> = {};
    subscriptions.forEach((s) => {
      const cat = s.category?.trim() || "Other";
      map[cat] = (map[cat] ?? 0) + s.price;
    });

    const total = Object.values(map).reduce((sum, v) => sum + v, 0);
    if (total === 0) return [];

    return Object.entries(map)
      .map(([name, value]) => ({
        name,
        value,
        percent: (value / total) * 100,
        color: CATEGORY_COLORS[name] ?? "#7F8C8D",
      }))
      .sort((a, b) => b.value - a.value);
  }, [subscriptions]);

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
          Insights
        </Text>

        {/* ── Total Spending card (gold) ──────────────────────────────────── */}
        {/*
         * Mirrors the Figma's gold gradient card.
         * All text and icons use colors.background (dark green) for contrast.
         */}
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: 24,
            padding: 24,
            marginBottom: 16,
          }}
        >
          {/* Label */}
          <Text
            style={{
              fontSize: 14,
              color: colors.background,
              fontFamily: "sans-medium",
              marginBottom: 8,
            }}
          >
            Total Monthly Spending
          </Text>

          {/* Large total */}
          <Text
            style={{
              fontSize: 40,
              color: colors.background,
              fontFamily: "sans-extrabold",
              marginBottom: 12,
            }}
          >
            {formatCurrency(totalMonthly)}
          </Text>

          {/* Trend badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "flex-start",
              backgroundColor: colors.background + "33",  // 20 % opacity dark green
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 6,
              gap: 6,
            }}
          >
            <Ionicons
              name="trending-up-outline"
              size={14}
              color={colors.background}
            />
            <Text
              style={{
                fontSize: 12,
                color: colors.background,
                fontFamily: "sans-medium",
              }}
            >
              {trendLabel}
            </Text>
          </View>
        </View>

        {/* ── Spending Trend card ─────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: colors.primary,
              fontFamily: "sans-semibold",
              marginBottom: 20,
            }}
          >
            Spending Trend
          </Text>

          {/* Custom bar chart — last 5 months, current month always at the right */}
          <SpendingTrendChart data={trendData} />
        </View>

        {/* ── Category Breakdown card ─────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: colors.primary,
              fontFamily: "sans-semibold",
              marginBottom: 20,
            }}
          >
            Category Breakdown
          </Text>

          {categoryData.length === 0 ? (
            // Empty state — no subscriptions in the store yet
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                fontFamily: "sans-regular",
                paddingVertical: 8,
              }}
            >
              Add subscriptions to see a breakdown.
            </Text>
          ) : (
            <CategoryBreakdown data={categoryData} />
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default InsightsScreen;
