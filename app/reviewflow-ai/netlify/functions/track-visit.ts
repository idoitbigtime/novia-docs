// Records a landing-page visit (top of the funnel). Fire-and-forget from the
// client via sendBeacon; deduped per visitor per business per hour.
import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { ok, fail, parseBody, preflight, clientIp } from "./_shared/http";
import { clampText } from "./_shared/validators";

interface Body { business_slug?: string; campaign_slug?: string; visitor_token?: string }

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);

  const b = parseBody<Body>(event);
  if (!b.business_slug) return fail("INVALID_INPUT");
  const visitor = clampText(b.visitor_token, 64);

  const sb = getServiceSupabase();
  const { data: biz } = await sb.from("businesses").select("id").eq("slug", b.business_slug).eq("is_active", true).maybeSingle();
  if (!biz) return ok({ ok: true }); // don't leak existence

  if (visitor) {
    const { count } = await sb.from("review_requests").select("id", { count: "exact", head: true })
      .eq("business_id", biz.id).eq("visitor_token", visitor)
      .gte("created_at", new Date(Date.now() - 3600_000).toISOString());
    if ((count ?? 0) > 0) return ok({ ok: true, deduped: true });
  }

  let campaign_id: string | null = null;
  if (b.campaign_slug) {
    const { data: cmp } = await sb.from("campaigns").select("id")
      .eq("business_id", biz.id).eq("slug", b.campaign_slug).eq("is_active", true).maybeSingle();
    campaign_id = cmp?.id ?? null;
  }

  await sb.from("review_requests").insert({
    business_id: biz.id, campaign_id, visitor_token: visitor,
    ip: clientIp(event.headers as Record<string, string | undefined>),
    user_agent: (event.headers["user-agent"] ?? "").slice(0, 300) || null,
  });
  return ok({ ok: true });
};
