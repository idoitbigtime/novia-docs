// Writes the GHL API key server-side. Clients can never read it back
// (column privilege revoked); they only see `has_api_key`.
import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { ok, fail, parseBody, preflight, bearer } from "./_shared/http";
import { isUuid } from "./_shared/validators";

interface Body { business_id?: string; api_key?: string | null }

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);

  const token = bearer(event.headers as Record<string, string | undefined>);
  if (!token) return fail("UNAUTHORIZED", 401);
  const sb = getServiceSupabase();
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return fail("UNAUTHORIZED", 401);

  const b = parseBody<Body>(event);
  if (!isUuid(b.business_id)) return fail("INVALID_INPUT");
  const key = typeof b.api_key === "string" ? b.api_key.trim() : null;
  if (key && (key.length < 20 || key.length > 400)) return fail("INVALID_INPUT", 400, { field: "api_key" });

  // Only owners / agency admins / platform admins may set the key.
  const { data: prof } = await sb.from("profiles").select("is_platform_admin").eq("id", u.user.id).maybeSingle();
  if (!prof?.is_platform_admin) {
    const { data: m } = await sb.from("memberships").select("role")
      .eq("user_id", u.user.id).eq("business_id", b.business_id).in("role", ["business_owner", "agency_admin"]).maybeSingle();
    if (!m) return fail("FORBIDDEN", 403);
  }

  const { error } = await sb.from("ghl_settings")
    .upsert({ business_id: b.business_id, ghl_api_key: key || null }, { onConflict: "business_id" });
  if (error) return fail("INTERNAL", 500);
  return ok({ ok: true, has_api_key: !!key });
};
