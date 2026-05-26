import type { SupabaseClient } from "@supabase/supabase-js";

export interface MonthlySnapshot {
  year: number;
  month: number;
  totalAmount: number;
}

/**
 * Inserts or updates the monthly snapshot for a user for a specific year and month.
 *
 * @throws The Supabase error returned when the upsert fails.
 */
export async function upsertMonthlySnapshot(
  client: SupabaseClient,
  userId: string,
  year: number,
  month: number,
  totalAmount: number
): Promise<void> {
  const { error } = await client
    .from("monthly_snapshots")
    .upsert(
      { user_id: userId, year, month, total_amount: totalAmount },
      { onConflict: "user_id,year,month" }
    );
  if (error) throw error;
}

/**
 * Fetches a user's monthly snapshots and returns them in chronological order (oldest first).
 *
 * @param userId - The user's unique identifier
 * @param limit - Maximum number of snapshots to return (default: 6)
 * @returns An array of `MonthlySnapshot` objects ordered from oldest to newest
 * @throws The error returned by the Supabase client if the query fails
 */
export async function fetchMonthlySnapshots(
  client: SupabaseClient,
  userId: string,
  limit = 6
): Promise<MonthlySnapshot[]> {
  const { data, error } = await client
    .from("monthly_snapshots")
    .select("year, month, total_amount")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data as { year: number; month: number; total_amount: number }[])
    .map((r) => ({ year: r.year, month: r.month, totalAmount: r.total_amount }))
    .reverse();
}
