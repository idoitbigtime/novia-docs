import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when the client-side Supabase config is present. The app renders a
 *  configuration screen instead of crashing at import time when it's missing. */
export const supabaseConfigured = !!(url && anon);

// A placeholder URL keeps createClient from throwing; every call then fails
// gracefully, and <ConfigGate> shows the fix instead of a blank page.
export const supabase: SupabaseClient = createClient(
  url || "https://not-configured.supabase.co",
  anon || "not-configured",
  { auth: { persistSession: true, autoRefreshToken: true } },
);
