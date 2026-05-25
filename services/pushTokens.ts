import type { SupabaseClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

export async function upsertPushToken(
  client: SupabaseClient,
  userId: string,
  token: string
): Promise<void> {
  const { error } = await client.from("push_tokens").upsert(
    {
      user_id: userId,
      token,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,token" }
  );

  if (error) throw error;
}

export async function deletePushToken(
  client: SupabaseClient,
  userId: string,
  token: string
): Promise<void> {
  const { error } = await client
    .from("push_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("token", token);

  if (error) throw error;
}
