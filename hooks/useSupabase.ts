import { useSession } from "@clerk/expo";
import { useMemo } from "react";
import { createAuthClient } from "@/utils/supabase/authClient";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns an authenticated Supabase client scoped to the current Clerk session.
 * Re-creates the client only when the session changes.
 */
export function useSupabase(): SupabaseClient {
  const { session } = useSession();

  return useMemo(
    () =>
      createAuthClient(() =>
        session
          ? session.getToken({ template: "supabase" })
          : Promise.resolve(null)
      ),
    [session]
  );
}
