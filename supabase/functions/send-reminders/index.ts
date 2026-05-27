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
  channelId?: string;
}

// deno-lint-ignore no-explicit-any
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

    // Group by daysLeft so each day-bucket gets one combined notification.
    const byDay = new Map<number, typeof subs>();
    for (const sub of subs) {
      const renewalDate = new Date(sub.renewal_date);
      const daysLeft = Math.round(
        (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (!byDay.has(daysLeft)) byDay.set(daysLeft, []);
      byDay.get(daysLeft)!.push(sub);
    }

    for (const [daysLeft, group] of byDay) {
      const label = daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
      const title = group.length === 1
        ? `${group[0].name} due ${label}`
        : `${group.length} payments due ${label}`;

      let body: string;
      if (group.length === 1) {
        const s = group[0];
        const currency = s.currency ?? "EUR";
        body = `${currency} ${Number(s.price).toFixed(2)} will be charged ${label}.`;
      } else {
        const lines = group.map((s) => `${s.name} — ${s.currency ?? "EUR"} ${Number(s.price).toFixed(2)}`);
        const currencies = [...new Set(group.map((s) => s.currency ?? "EUR"))];
        if (currencies.length === 1) {
          const total = group.reduce((sum, s) => sum + Number(s.price), 0);
          lines.push(`Total: ${currencies[0]} ${total.toFixed(2)}`);
        }
        body = lines.join("\n");
      }

      for (const { token } of tokenRows) {
        messages.push({
          to: token,
          title,
          body,
          data: { daysLeft },
          sound: "default",
          priority: "high",
          channelId: "payment-reminders",
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
