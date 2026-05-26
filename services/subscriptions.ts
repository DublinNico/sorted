import type { SupabaseClient } from "@supabase/supabase-js";

// ─── DB row ───────────────────────────────────────────────────────────────────

interface SubscriptionRow {
  id: string;
  user_id: string;
  name: string;
  price: number;
  currency: string;
  billing: string;
  frequency: string;
  category: string;
  status: string;
  start_date: string;
  renewal_date: string;
  icon_url: string;
  color: string;
}

/**
 * Convert a database `subscriptions` row into a `Subscription` object for application use.
 *
 * @param row - The raw `SubscriptionRow` from the database
 * @returns A `Subscription` with `startDate` and `renewalDate` mapped from `start_date`/`renewal_date` and `icon` set to `{ uri: icon_url }`
 */

export function rowToSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    currency: row.currency,
    billing: row.billing,
    frequency: row.frequency,
    category: row.category,
    status: row.status,
    startDate: row.start_date,
    renewalDate: row.renewal_date,
    icon: { uri: row.icon_url },
    color: row.color,
  };
}

/**
 * Convert a Subscription object into a Supabase `subscriptions` table row payload.
 *
 * @param sub - Subscription object without `id`; when `sub.icon` is an object its `uri` will be extracted
 * @param userId - Owner user ID to assign to the `user_id` field
 * @param id - Optional row `id` to include in the returned payload
 * @returns An object shaped for the `subscriptions` table: field names are mapped, `icon.uri` is stored as `icon_url`, and defaults are applied for `currency` (`"EUR"`), `frequency` (falls back to `billing`), `category` (`"Other"`), `status` (`"active"`), `start_date`/`renewal_date` (current ISO timestamp when missing), and `color` (`"#C9A84C"`). The `id` property is present only if `id` was provided.
 */
export function subscriptionToRow(
  sub: Omit<Subscription, "id">,
  userId: string,
  id?: string
): Omit<SubscriptionRow, "user_id"> & { user_id: string; id?: string } {
  const iconUri =
    typeof sub.icon === "object" && "uri" in sub.icon
      ? (sub.icon as { uri: string }).uri
      : "";
  return {
    ...(id ? { id } : {}),
    user_id: userId,
    name: sub.name,
    price: sub.price,
    currency: sub.currency ?? "EUR",
    billing: sub.billing,
    frequency: sub.frequency ?? sub.billing,
    category: sub.category ?? "Other",
    status: sub.status ?? "active",
    start_date: sub.startDate ?? new Date().toISOString(),
    renewal_date: sub.renewalDate ?? new Date().toISOString(),
    icon_url: iconUri,
    color: sub.color ?? "#C9A84C",
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export async function fetchSubscriptions(
  client: SupabaseClient,
  userId: string
): Promise<Subscription[]> {
  const { data, error } = await client
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  if (error) throw error;
  return (data as SubscriptionRow[]).map(rowToSubscription);
}

export async function createSubscription(
  client: SupabaseClient,
  sub: Subscription,
  userId: string
): Promise<Subscription> {
  // Do not pass the client-generated ID — let Supabase generate a valid UUID.
  const row = subscriptionToRow(sub, userId);
  const { data, error } = await client
    .from("subscriptions")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return rowToSubscription(data as SubscriptionRow);
}

export async function updateSubscription(
  client: SupabaseClient,
  sub: Subscription,
  userId: string
): Promise<Subscription> {
  const row = subscriptionToRow(sub, userId, sub.id);
  const { data, error } = await client
    .from("subscriptions")
    .update(row)
    .eq("id", sub.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return rowToSubscription(data as SubscriptionRow);
}

export async function deleteSubscription(
  client: SupabaseClient,
  id: string,
  userId: string
): Promise<void> {
  const { error } = await client
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
