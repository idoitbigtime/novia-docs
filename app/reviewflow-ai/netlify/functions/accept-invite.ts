// Accepts a team invitation for the signed-in user (email must match the invite).
import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { requireUser } from "./_shared/authz";
import { ok, fail, parseBody, preflight } from "./_shared/http";

interface Body { token?: string }

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);
  const user = await requireUser(event.headers as Record<string, string | undefined>);
  if (!user) return fail("UNAUTHORIZED", 401);
  const b = parseBody<Body>(event);
  if (typeof b.token !== "string" || !/^[a-f0-9]{48}$/.test(b.token)) return fail("INVALID_INPUT");

  const sb = getServiceSupabase();
  const { data, error } = await sb.rpc("accept_invitation", { p_token: b.token, p_user_id: user.id, p_email: user.email ?? "" });
  if (error) return fail("INTERNAL", 500);
  const r = data as { ok: boolean; error?: string; business_id?: string };
  if (!r.ok) return fail(r.error === "EMAIL_MISMATCH" ? "FORBIDDEN" : "INVALID_INPUT", r.error === "EMAIL_MISMATCH" ? 403 : 410, { field: "token" });
  return ok({ ok: true, business_id: r.business_id });
};
