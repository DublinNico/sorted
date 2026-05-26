import { colors } from "@/constants/theme";
import { useSupabase } from "@/hooks/useSupabase";
import {
  getNotificationPrefs,
  upsertNotificationPrefs,
} from "@/services/notificationPrefs";
import { requestPermissions } from "@/utils/notifications";
import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalPrefs {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  upcomingEnabled: boolean;
  weeklySummary: boolean;
  priceChanges: boolean;
}

const DEFAULTS: LocalPrefs = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  upcomingEnabled: true,
  weeklySummary: true,
  priceChanges: true,
};

// ─── Row component ────────────────────────────────────────────────────────────

function SettingRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  saving,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  saving?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={colors.accent} />
      </View>

      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "sans-semibold" }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "sans-regular" }}>
          {description}
        </Text>
      </View>

      {saving ? (
        <ActivityIndicator size="small" color={colors.accent} />
      ) : (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.background}
        />
      )}
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <Text
      style={{
        fontSize: 12,
        color: colors.mutedForeground,
        fontFamily: "sans-semibold",
        letterSpacing: 1.2,
        marginBottom: 10,
        marginTop: 6,
      }}
    >
      {title}
    </Text>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { userId } = useAuth();

  const [prefs, setPrefs] = useState<LocalPrefs>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load from Supabase in background — show defaults immediately so screen
  // is never blocked by a network call.
  useEffect(() => {
    if (!userId) return;
    getNotificationPrefs(supabase, userId)
      .then((remote) => {
        setPrefs((prev) => ({ ...prev, pushEnabled: remote.enabled }));
      })
      .catch((err) => {
        console.error("Failed to load notification prefs:", err);
      });
  }, [userId]);

  const update = async (patch: Partial<LocalPrefs>) => {
    const updated = { ...prefs, ...patch };
    setPrefs(updated);

    if (patch.pushEnabled !== undefined && patch.pushEnabled) {
      const granted = await requestPermissions();
      if (!granted) {
        setPrefs((p) => ({ ...p, pushEnabled: false }));
        return;
      }
    }

    // Debounce saves so rapid toggles don't spam the DB.
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!userId) return;
      setSaving(true);
      try {
        await upsertNotificationPrefs(supabase, userId, {
          enabled: updated.pushEnabled,
          daysBefore: [1, 3, 7],
        });
      } catch {
        // Ignore — prefs are still held in local state.
      } finally {
        setSaving(false);
      }
    }, 800);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.primary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, color: colors.primary, fontFamily: "sans-bold" }}>
          Notifications
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
      >
        {/* ── Channels ─────────────────────────────────────────────────────── */}
        <SectionHeader title="CHANNELS" />

        <SettingRow
          icon="notifications-outline"
          title="Push Notifications"
          description="Get notified on this device"
          value={prefs.pushEnabled}
          onValueChange={(v) => update({ pushEnabled: v })}
          saving={saving}
        />
        <SettingRow
          icon="mail-outline"
          title="Email"
          description="Receive email updates (saved locally)"
          value={prefs.emailEnabled}
          onValueChange={(v) => update({ emailEnabled: v })}
        />
        <SettingRow
          icon="chatbubble-outline"
          title="SMS"
          description="Text message alerts (saved locally)"
          value={prefs.smsEnabled}
          onValueChange={(v) => update({ smsEnabled: v })}
        />

        {/* ── What to notify ───────────────────────────────────────────────── */}
        <SectionHeader title="WHAT TO NOTIFY" />

        <SettingRow
          icon="calendar-outline"
          title="Upcoming Payments"
          description="3 days before due date"
          value={prefs.upcomingEnabled}
          onValueChange={(v) => update({ upcomingEnabled: v })}
        />
        <SettingRow
          icon="bar-chart-outline"
          title="Weekly Summary"
          description="Every Monday morning"
          value={prefs.weeklySummary}
          onValueChange={(v) => update({ weeklySummary: v })}
        />
        <SettingRow
          icon="pricetag-outline"
          title="Price Changes"
          description="When subscription costs change"
          value={prefs.priceChanges}
          onValueChange={(v) => update({ priceChanges: v })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
