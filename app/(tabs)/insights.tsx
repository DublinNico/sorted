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
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import { Animated, Easing, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

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
  Fitness:           "#FF6B35",
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

// Height (px) of the bar drawing area.
const BAR_CHART_HEIGHT = 160;

// ─── SpendingTrendChart ───────────────────────────────────────────────────────

/**
 * SpendingTrendChart
 * Animated bar chart with Y-axis labels and horizontal gridlines.
 * Bars grow from 0 to full height each time the Insights tab is focused.
 *
 * @param data  Array of { month, amount } objects (oldest → newest)
 */
const SpendingTrendChart = ({ data }: { data: { month: string; amount: number }[] }) => {
  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  // Round up to nearest clean step so Y-axis labels are whole numbers.
  const step  = Math.ceil(maxAmount / 4 / 100) * 100 || 100;
  const yMax  = step * 4;
  // Y-axis labels rendered top → bottom.
  const yLabels = [yMax, step * 3, step * 2, step, 0];

  // One Animated.Value per bar — persist across re-renders.
  const animValues = useRef(data.map(() => new Animated.Value(0))).current;

  // Re-run the grow animation every time the Insights tab is focused.
  useFocusEffect(
    useCallback(() => {
      animValues.forEach((v) => v.setValue(0));
      Animated.parallel(
        animValues.map((v, i) =>
          Animated.timing(v, {
            toValue:         1,
            duration:        550,
            delay:           i * 80,
            easing:          Easing.out(Easing.cubic),
            useNativeDriver: false,
          })
        )
      ).start();
    }, [])
  );

  return (
    <View style={{ flexDirection: "row", gap: 8 }}>

      {/* ── Y-axis labels ── */}
      <View
        style={{
          width:           38,
          height:          BAR_CHART_HEIGHT,
          justifyContent:  "space-between",
          alignItems:      "flex-end",
        }}
      >
        {yLabels.map((v) => (
          <Text
            key={`ylabel-${v}`}
            style={{
              fontSize:    10,
              color:       colors.mutedForeground,
              fontFamily:  "sans-regular",
              lineHeight:  12,
            }}
          >
            {v}
          </Text>
        ))}
      </View>

      {/* ── Chart area + month labels ── */}
      <View style={{ flex: 1 }}>

        {/* Bars layered on top of horizontal gridlines */}
        <View style={{ height: BAR_CHART_HEIGHT, position: "relative" }}>

          {/* Gridlines — one per Y label, evenly spaced top → bottom */}
          {yLabels.map((v, i) => (
            <View
              key={`grid-${v}`}
              style={{
                position:        "absolute",
                left:            0,
                right:           0,
                top:             (i / (yLabels.length - 1)) * (BAR_CHART_HEIGHT - 1),
                height:          1,
                backgroundColor: colors.border + "55",
              }}
            />
          ))}

          {/* Animated bars */}
          <View
            style={{
              flexDirection:  "row",
              alignItems:     "flex-end",
              height:         "100%",
              gap:            6,
            }}
          >
            {data.map((d, i) => {
              const targetH = Math.max(4, (d.amount / yMax) * BAR_CHART_HEIGHT);
              const animH   = animValues[i].interpolate({
                inputRange:  [0, 1],
                outputRange: [0, targetH],
              });

              return (
                <View
                  key={`bar-${i}`}
                  style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" }}
                >
                  <Animated.View
                    style={{
                      width:                "78%",
                      height:               animH,
                      backgroundColor:      colors.accent,
                      borderTopLeftRadius:  6,
                      borderTopRightRadius: 6,
                    }}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Month labels */}
        <View style={{ flexDirection: "row", marginTop: 8 }}>
          {data.map((d, i) => (
            <View key={`label-${i}`} style={{ flex: 1, alignItems: "center" }}>
              <Text
                style={{
                  fontSize:   12,
                  color:      colors.mutedForeground,
                  fontFamily: "sans-regular",
                }}
              >
                {d.month}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Donut chart helpers ──────────────────────────────────────────────────────

/** Dimensions of the SVG canvas and ring radii. */
const DONUT_SIZE = 200;
const OUTER_R    = 88;
const INNER_R    = 54;
/** Small gap (degrees) between adjacent segments. */
const GAP_DEG    = 1.5;

/**
 * polarToCartesian
 * Converts a polar angle (0° = top, clockwise) to an x/y point on a circle.
 */
const polarToCartesian = (cx: number, cy: number, r: number, deg: number) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

/**
 * arcPath
 * Returns the SVG path string for a donut ring segment.
 * Caps the sweep at 359.99° so a single-segment chart still renders.
 */
const arcPath = (
  cx: number, cy: number,
  outerR: number, innerR: number,
  startDeg: number, endDeg: number,
): string => {
  const sweep = Math.min(endDeg - startDeg, 359.99);
  const end   = startDeg + sweep;
  const large = sweep > 180 ? 1 : 0;
  const os = polarToCartesian(cx, cy, outerR, startDeg);
  const oe = polarToCartesian(cx, cy, outerR, end);
  const ie = polarToCartesian(cx, cy, innerR, end);
  const is = polarToCartesian(cx, cy, innerR, startDeg);
  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${is.x} ${is.y}`,
    "Z",
  ].join(" ");
};

// ─── CategoryBreakdown ────────────────────────────────────────────────────────

/**
 * CategoryEntry
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
 * Renders a donut chart + legend list.
 * The donut scales in with a spring animation on every tab focus.
 *
 * @param data  Sorted array of category entries (highest value first)
 */
const CategoryBreakdown = ({ data }: { data: CategoryEntry[] }) => {

  // Spring scale animation — replays each time the Insights tab is focused.
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue:         1,
        tension:         55,
        friction:        7,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  // Compute SVG arc path for each segment.
  const cx = DONUT_SIZE / 2;
  const cy = DONUT_SIZE / 2;
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let angle = 0;
  const segments = data.map((d) => {
    const sweep = (d.value / total) * 360;
    const start = angle + GAP_DEG / 2;
    const end   = angle + sweep - GAP_DEG / 2;
    angle += sweep;
    return { ...d, path: arcPath(cx, cy, OUTER_R, INNER_R, start, end) };
  });

  return (
    <View style={{ gap: 20 }}>

      {/* ── Donut chart — springs in on tab focus ── */}
      <Animated.View
        style={{ alignItems: "center", transform: [{ scale: scaleAnim }] }}
      >
        <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
          {segments.map((seg) => (
            <Path key={seg.name} d={seg.path} fill={seg.color} />
          ))}
        </Svg>
      </Animated.View>

      {/* ── Legend list ── */}
      <View style={{ gap: 14 }}>
        {data.map((cat) => (
          <View
            key={cat.name}
            style={{
              flexDirection:  "row",
              alignItems:     "center",
              justifyContent: "space-between",
            }}
          >
            {/* Left: colour dot + category name */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width:           12,
                  height:          12,
                  borderRadius:    6,
                  backgroundColor: cat.color,
                }}
              />
              <Text
                style={{
                  fontSize:   14,
                  color:      colors.primary,
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
                  fontSize:   14,
                  color:      colors.primary,
                  fontFamily: "sans-semibold",
                }}
              >
                {formatCurrency(cat.value)}
              </Text>
              <Text
                style={{
                  fontSize:   12,
                  color:      colors.mutedForeground,
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
};

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
