import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "./info";

/**
 * Creates a Supabase client that attaches a fresh Clerk JWT on every request.
 * Pass `getToken` from Clerk's useSession hook.
 */
export function createAuthClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  return createClient(`https://${projectId}.supabase.co`, publicAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken();
        const headers = new Headers((options as RequestInit).headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(url as RequestInfo, { ...(options as RequestInit), headers });
      },
    },
  });
}
