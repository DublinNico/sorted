import type { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationPrefs {
  enabled: boolean;
  daysBefore: number[];
}

const DEFAULTS: NotificationPrefs = { enabled: true, daysBefore: [1, 3, 7] };

/**
 * Fetches a user's notification preferences from the database and falls back to defaults if none are stored.
 *
 * @returns The user's `NotificationPrefs`. If no record exists, returns the defaults (`enabled: true`, `daysBefore: [1, 3, 7]`) as a newly created object.
 */
export async function getNotificationPrefs(
  client: SupabaseClient,
  userId: string
): Promise<NotificationPrefs> {
  const { data, error } = await client
    .from("notification_preferences")
    .select("enabled, days_before")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return { enabled: DEFAULTS.enabled, daysBefore: [...DEFAULTS.daysBefore] };
  return { enabled: data.enabled, daysBefore: data.days_before };
}

export async function upsertNotificationPrefs(
  client: SupabaseClient,
  userId: string,
  prefs: NotificationPrefs
): Promise<void> {
  const { error } = await client.from("notification_preferences").upsert(
    {
      user_id: userId,
      enabled: prefs.enabled,
      days_before: prefs.daysBefore,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
