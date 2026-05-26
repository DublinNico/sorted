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

// ─── Days-before option ───────────────────────────────────────────────────────

const DAYS_OPTIONS = [
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "7 days before" },
];

/**
 * Screen for viewing and editing the user's push notification preferences.
 *
 * Loads preferences from Supabase on mount, requests notification permissions when enabling push,
 * and saves updates with a short debounce to avoid rapid network calls.
 *
 * @returns A JSX element rendering the Notifications screen
 */

export default function NotificationsScreen() {
  const router = useRouter();
  const supabase = useSupabase();
  const { userId } = useAuth();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [daysBefore, setDaysBefore] = useState<number[]>([1, 3, 7]);
  const [saving, setSaving] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load real prefs from Supabase on mount.
  useEffect(() => {
    if (!userId) return;
    getNotificationPrefs(supabase, userId)
      .then((remote) => {
        setPushEnabled(remote.enabled);
        setDaysBefore(remote.daysBefore);
      })
      .catch((err) => console.error("Failed to load notification prefs:", err));
  }, [userId]);

  // Debounced save — avoids spamming Supabase on rapid toggles.
  const save = (enabled: boolean, days: number[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!userId) return;
      setSaving(true);
      try {
        await upsertNotificationPrefs(supabase, userId, { enabled, daysBefore: days });
      } catch (err) {
        console.error("Failed to save notification prefs:", err);
      } finally {
        setSaving(false);
      }
    }, 800);
  };

  const handlePushToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) return;
    }
    setPushEnabled(value);
    save(value, daysBefore);
  };

  const handleDayToggle = (day: number) => {
    const updated = daysBefore.includes(day)
      ? daysBefore.filter((d) => d !== day)
      : [...daysBefore, day].sort((a, b) => a - b);
    setDaysBefore(updated);
    save(pushEnabled, updated);
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
        {saving && (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginLeft: "auto" }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
      >
        {/* ── Push Notifications toggle ─────────────────────────────────────── */}
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
          PUSH NOTIFICATIONS
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            marginBottom: 24,
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
            <Ionicons name="notifications-outline" size={20} color={colors.accent} />
          </View>

          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 15, color: colors.primary, fontFamily: "sans-semibold" }}>
              Push Notifications
            </Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "sans-regular" }}>
              Get reminded before payments are due
            </Text>
          </View>

          <Switch
            value={pushEnabled}
            onValueChange={handlePushToggle}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.background}
          />
        </View>

        {/* ── Remind me section ─────────────────────────────────────────────── */}
        <Text
          style={{
            fontSize: 12,
            color: colors.mutedForeground,
            fontFamily: "sans-semibold",
            letterSpacing: 1.2,
            marginBottom: 10,
          }}
        >
          REMIND ME
        </Text>

        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 6,
            opacity: pushEnabled ? 1 : 0.4,
          }}
          pointerEvents={pushEnabled ? "auto" : "none"}
        >
          {DAYS_OPTIONS.map((opt, idx) => {
            const active = daysBefore.includes(opt.value);
            const isLast = idx === DAYS_OPTIONS.length - 1;

            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => handleDayToggle(opt.value)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.border,
                  gap: 14,
                }}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: active ? colors.accent : colors.border,
                    backgroundColor: active ? colors.accent : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active && (
                    <Ionicons name="checkmark" size={13} color={colors.background} />
                  )}
                </View>

                <Text
                  style={{
                    fontSize: 15,
                    color: active ? colors.primary : colors.mutedForeground,
                    fontFamily: active ? "sans-semibold" : "sans-regular",
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={{
            fontSize: 12,
            color: colors.mutedForeground,
            fontFamily: "sans-regular",
            marginTop: 10,
            paddingHorizontal: 4,
          }}
        >
          Select how many days before a payment is due you want to be reminded.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
