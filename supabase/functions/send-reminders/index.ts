// Sorted — send-reminders Edge Function
// Scheduled daily (e.g. 09:00 UTC) via pg_cron.
// For each user with notifications enabled, finds subscriptions due in
// N days (where N is in their days_before preference) and sends an
// Expo push notification via the Expo Push API.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  priority?: "high";
}

/**
 * Send scheduled Expo push reminders for users who enabled notifications.
 *
 * Fetches enabled notification preferences, finds active subscriptions whose
 * renewal dates match each user's reminder offsets, collects user push tokens,
 * builds Expo push messages, sends them in batches, and returns the count of
 * tickets accepted by Expo.
 *
 * @param req - Incoming HTTP request (must include `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}`)
 * @param supabaseOverride - Optional Supabase client instance to use instead of constructing one from environment (useful for testing)
 * @returns A JSON `Response` with body `{ sent: number }` where `sent` is the number of push tickets whose `status` was `"ok"`.
 *
 * Possible responses:
 * - `401 Unauthorized` if the request is not authorized with the Supabase service role key.
 * - `500` if fetching notification preferences from the database fails.
 */
export async function handler(req: Request, supabaseOverride?: any): Promise<Response> {
  // Auth: only allow calls from Supabase itself (pg_cron HTTP or dashboard invoke).
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceKey || !authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = supabaseOverride ?? createClient(
    Deno.env.get("SUPABASE_URL")!,
    serviceKey,
  );

  const today = new Date();

  // ── Build list of (user_id, days_before) pairs that want reminders ──────────

  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("user_id, days_before")
    .eq("enabled", true);

  if (prefsError) {
    console.error("Failed to fetch prefs:", prefsError);
    return new Response("error", { status: 500 });
  }

  const messages: PushMessage[] = [];

  for (const pref of prefs ?? []) {
    const { user_id, days_before } = pref as { user_id: string; days_before: number[] };

    // Collect all target dates for this user.
    const targetDates = (days_before as number[]).map((d) => {
      const dt = new Date(today);
      dt.setDate(dt.getDate() + d);
      return dt.toISOString().split("T")[0]; // YYYY-MM-DD
    });

    // Find subscriptions due on any of those target dates.
    // Filter in JS after fetching active subs — avoids SQL cast issues.
    const { data: allSubs, error: subError } = await supabase
      .from("subscriptions")
      .select("id, name, price, currency, renewal_date")
      .eq("user_id", user_id)
      .eq("status", "active");

    const subs = (allSubs ?? []).filter((s: { renewal_date: string }) =>
      targetDates.includes(s.renewal_date.split("T")[0])
    );

    if (subError) {
      console.error(`Sub fetch error for ${user_id}:`, subError);
      continue;
    }

    if (!subs || subs.length === 0) continue;

    // Get push tokens for this user.
    const { data: tokenRows } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", user_id);

    if (!tokenRows || tokenRows.length === 0) continue;

    for (const sub of subs) {
      const renewalDate = new Date(sub.renewal_date);
      const daysLeft = Math.round(
        (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const label = daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
      const amount = `${sub.currency ?? "EUR"} ${Number(sub.price).toFixed(2)}`;

      for (const { token } of tokenRows) {
        messages.push({
          to: token,
          title: `${sub.name} due ${label}`,
          body: `${amount} will be charged ${label}.`,
          data: { subscriptionId: sub.id },
          sound: "default",
          priority: "high",
        });
      }
    }
  }

  if (messages.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Send in chunks of 100 (Expo limit) ──────────────────────────────────────

  const CHUNK = 100;
  let sent = 0;

  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(chunk),
    });

    if (res.ok) {
      const json = await res.json() as { data?: Array<{ status: string; message?: string }> };
      for (const ticket of json.data ?? []) {
        if (ticket.status === "ok") {
          sent += 1;
        } else {
          console.error("Expo push ticket error:", ticket.message ?? ticket.status);
        }
      }
    } else {
      const text = await res.text();
      console.error("Expo push error:", text);
    }
  }

  console.log(`Sent ${sent} notifications`);
  return new Response(JSON.stringify({ sent }), {
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve((req) => handler(req));
