import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { classifyReview } from "./_shared/ai";
import { deliverNow } from "./_shared/outbox";
import { ok, fail, parseBody, preflight, clientIp } from "./_shared/http";
import { isValidRating, clampText, normalizePhone, normalizeEmail, LIMITS } from "./_shared/validators";

interface Body {
  business_slug?: string;
  campaign_slug?: string;
  rating?: number;
  text?: string;
  language?: string;
  consent?: boolean;
  visitor_token?: string;
  customer?: { full_name?: string | null; phone?: string | null; email?: string | null };
}

const PER_IP_PER_HOUR = 60;     // a busy venue shares one NAT IP — do not go lower
const PER_BUSINESS_PER_DAY = 2000;

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);

  const b = parseBody<Body>(event);
  if (!b.business_slug || !isValidRating(b.rating)) return fail("INVALID_INPUT");

  const text = clampText(b.text, LIMITS.text);
  const full_name = clampText(b.customer?.full_name, LIMITS.name);
  const phone = normalizePhone(b.customer?.phone);
  const email = normalizeEmail(b.customer?.email);
  if (b.customer?.email && !email) return fail("INVALID_INPUT", 400, { field: "email" });
  if (b.customer?.phone && !phone) return fail("INVALID_INPUT", 400, { field: "phone" });

  const sb = getServiceSupabase();
  const { data: biz } = await sb.from("businesses").select("id, is_active").eq("slug", b.business_slug).maybeSingle();
  if (!biz || !biz.is_active) return fail("BUSINESS_NOT_FOUND", 404);

  // rate limits (no extra table: count recent reviews)
  const ip = clientIp(event.headers as Record<string, string | undefined>);
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
  if (ip) {
    const { count } = await sb.from("reviews").select("id", { count: "exact", head: true })
      .eq("business_id", biz.id).eq("ip", ip).gte("created_at", hourAgo);
    if ((count ?? 0) >= PER_IP_PER_HOUR) return fail("RATE_LIMITED", 429);
  }
  {
    const { count } = await sb.from("reviews").select("id", { count: "exact", head: true })
      .eq("business_id", biz.id).gte("created_at", dayAgo);
    if ((count ?? 0) >= PER_BUSINESS_PER_DAY) return fail("RATE_LIMITED", 429);
  }

  let campaign_id: string | null = null;
  if (b.campaign_slug) {
    const { data: cmp } = await sb.from("campaigns").select("id")
      .eq("business_id", biz.id).eq("slug", b.campaign_slug).eq("is_active", true).maybeSingle();
    campaign_id = cmp?.id ?? null;
  }

  // AI advises (3s budget); the rules inside decide the route.
  const ai = await classifyReview({ rating: b.rating, text, language: b.language ?? "he" });

  const { data, error } = await sb.rpc("submit_review_tx", {
    p_business_id: biz.id,
    p_campaign_id: campaign_id,
    p_rating: b.rating,
    p_text: text,
    p_language: b.language ?? "he",
    p_full_name: full_name,
    p_phone: phone,
    p_email: email,
    p_consent: b.consent === true,
    p_ip: ip,
    p_visitor_token: clampText(b.visitor_token, 64),
    p_ai: ai,
  });
  if (error || !data) {
    console.error("submit_review_tx failed", error);
    return fail("INTERNAL", 500);
  }

  const result = data as { review_id: string; route: string; coupon: unknown; outbox_id?: string | null };

  // Best-effort inline delivery (GHL is a no-op until configured); sweeper retries the rest.
  await deliverNow(result.outbox_id, 2500);

  return ok({ review_id: result.review_id, route: result.route, coupon: result.coupon, sentiment: ai.sentiment });
};
