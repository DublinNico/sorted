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

// ─── Converters ───────────────────────────────────────────────────────────────

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
