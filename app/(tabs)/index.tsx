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
import { G, Path, Svg } from "react-native-svg";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Housing:            "#D4633A",
  Utilities:          "#C9A84C",
  Entertainment:      "#4CAF50",
  Productivity:       "#5C7CFA",
  "AI Tools":         "#9C5CF5",
  Cloud:              "#38BDF8",
  Music:              "#FF6B9D",
  Design:             "#FF9500",
  "Developer Tools":  "#00D4AA",
  Fitness:            "#FF6B35",
  Other:              "#6B7280",
};

// ─── Donut chart ──────────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number, cy: number,
  R: number, r: number,
  start: number, end: number
): string {
  if (Math.abs(end - start) >= 359.99) end = start + 359.99;
  const o1 = polarToCartesian(cx, cy, R, start);
  const o2 = polarToCartesian(cx, cy, R, end);
  const i1 = polarToCartesian(cx, cy, r, end);
  const i2 = polarToCartesian(cx, cy, r, start);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${R} ${R} 0 ${large} 1 ${o2.x} ${o2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${r} ${r} 0 ${large} 0 ${i2.x} ${i2.y}`,
    "Z",
  ].join(" ");
}

interface ChartSlice { label: string; value: number; color: string }

function DonutChart({ data, size = 130 }: { data: ChartSlice[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.44;
  const r = size * 0.27;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return (
    <Svg width={size} height={size}>
      <Path d={arcPath(cx, cy, R, r, 0, 359.99)} fill={colors.card} />
    </Svg>
  );

  let angle = 0;
  return (
    <Svg width={size} height={size}>
      <G>
        {data.map((slice, i) => {
          const sweep = (slice.value / total) * 360;
          const path = arcPath(cx, cy, R, r, angle, angle + sweep);
          angle += sweep;
          return <Path key={i} d={path} fill={slice.color} />;
        })}
      </G>
    </Svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  gold,
  valueColor,
  flex,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  gold?: boolean;
  valueColor?: string;
  flex?: number;
}) {
  return (
    <View
      style={{
        flex: flex ?? 1,
        backgroundColor: gold ? colors.accent : colors.card,
        borderRadius: 20,
        padding: 16,
        gap: 4,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <Ionicons
          name={icon}
          size={14}
          color={gold ? colors.background : colors.mutedForeground}
        />
        <Text
          style={{
            fontSize: 13,
            color: gold ? colors.background : colors.mutedForeground,
            fontFamily: "sans-medium",
          }}
        >
          {label}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 26,
          color: valueColor ?? (gold ? colors.background : colors.primary),
          fontFamily: "sans-extrabold",
          lineHeight: 32,
        }}
      >
        {value}
      </Text>
      {sub && (
        <Text
          style={{
            fontSize: 12,
            color: gold ? colors.background + "CC" : colors.mutedForeground,
            fontFamily: "sans-regular",
          }}
        >
          {sub}
        </Text>
      )}
    </View>
  );
}

// ─── Due Soon card ────────────────────────────────────────────────────────────

function DueSoonCard({ sub }: { sub: Subscription }) {
  const [imgError, setImgError] = useState(false);
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 18,
        padding: 14,
        width: 130,
        gap: 10,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: sub.color ? sub.color + "33" : colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={imgError ? icons.wallet : sub.icon}
          style={{ width: 28, height: 28, borderRadius: 6 }}
          resizeMode="contain"
          onError={() => setImgError(true)}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{ fontSize: 14, color: colors.primary, fontFamily: "sans-semibold" }}
      >
        {sub.name}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Ionicons name="calendar-outline" size={11} color={colors.mutedForeground} />
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "sans-regular" }}>
          {dayjs(sub.renewalDate).format("D MMM")}
        </Text>
      </View>
    </View>
  );
}

// ─── Home screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { user } = useUser();
  const { subscriptions, monthlySnapshots } = useSubscriptionsStore();
  const router = useRouter();

  const displayName =
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "there";

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.price, 0);

  const now = Date.now();
  const activeCount = subscriptions.filter((s) => s.status !== "cancelled").length;

  // Month-over-month change derived from real Supabase snapshots.
  const monthlyChange = (() => {
    if (monthlySnapshots.length < 2) return null;
    const prev = monthlySnapshots[monthlySnapshots.length - 2].totalAmount;
    const curr = monthlySnapshots[monthlySnapshots.length - 1].totalAmount;
    if (prev === 0) return null;
    const pct = ((curr - prev) / prev) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  })();

  // Due soon: next 5 future renewals sorted by date
  const dueSoon = [...subscriptions]
    .filter((s) => s.renewalDate && new Date(s.renewalDate).getTime() > now)
    .sort((a, b) => new Date(a.renewalDate!).getTime() - new Date(b.renewalDate!).getTime())
    .slice(0, 5);

  // Category breakdown for donut + legend
  const categoryMap = subscriptions.reduce<Record<string, number>>((acc, s) => {
    const cat = s.category?.trim() || "Other";
    acc[cat] = (acc[cat] ?? 0) + s.price;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryMap)
    .sort(([, a], [, b]) => b - a);

  const topCategories = sortedCategories.slice(0, 3);
  const otherTotal = sortedCategories.slice(3).reduce((s, [, v]) => s + v, 0);
  if (otherTotal > 0) topCategories.push(["Other", otherTotal]);

  const chartData: ChartSlice[] = topCategories.map(([label, value]) => ({
    label,
    value,
    color: CATEGORY_COLORS[label] ?? CATEGORY_COLORS.Other,
  }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <View>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "sans-regular" }}>
              Welcome back,
            </Text>
            <Text style={{ fontSize: 24, color: colors.primary, fontFamily: "sans-bold" }}>
              {displayName}
            </Text>
          </View>
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
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* ── Stats grid row 1 — full-width gold card ────────────────────── */}
        <View style={{ marginBottom: 12 }}>
          <StatCard
            label="Monthly"
            value={formatCurrency(totalMonthly)}
            icon="card-outline"
            gold
          />
        </View>

        {/* ── Stats grid row 2 ────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <StatCard
            label="Active"
            value={String(activeCount)}
            sub="Payments"
            icon="cash-outline"
          />
          <StatCard
            label="Change"
            value={monthlyChange ?? "—"}
            sub="vs last month"
            icon="trending-up-outline"
            valueColor={monthlyChange ? colors.accent : colors.mutedForeground}
          />
        </View>

        {/* ── Due Soon ────────────────────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 17, color: colors.primary, fontFamily: "sans-bold" }}>
            Due Soon
          </Text>
          <Pressable onPress={() => router.navigate("/(tabs)/subscriptions")}>
            <Text style={{ fontSize: 13, color: colors.accent, fontFamily: "sans-semibold" }}>
              See all
            </Text>
          </Pressable>
        </View>

        {dueSoon.length === 0 ? (
          <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "sans-regular", paddingVertical: 8, marginBottom: 20 }}>
            No upcoming payments.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 4 }}
            style={{ marginBottom: 20 }}
          >
            {dueSoon.map((sub) => (
              <DueSoonCard key={sub.id} sub={sub} />
            ))}
          </ScrollView>
        )}

        {/* ── Spending Overview ───────────────────────────────────────────── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 18,
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 17, color: colors.primary, fontFamily: "sans-bold" }}>
              Spending Overview
            </Text>
            <Pressable
              onPress={() => router.navigate("/(tabs)/subscriptions")}
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              <Text style={{ fontSize: 13, color: colors.accent, fontFamily: "sans-semibold" }}>
                View All
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.accent} />
            </Pressable>
          </View>

          {chartData.length === 0 ? (
            <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "sans-regular", textAlign: "center", paddingVertical: 16 }}>
              Add payments to see your spending breakdown.
            </Text>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
              <DonutChart data={chartData} size={120} />
              <View style={{ flex: 1, gap: 10 }}>
                {chartData.map((slice) => (
                  <View key={slice.label} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: slice.color }} />
                      <Text style={{ fontSize: 13, color: colors.primary, fontFamily: "sans-medium" }}>
                        {slice.label}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: colors.primary, fontFamily: "sans-semibold" }}>
                      {formatCurrency(slice.value)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
