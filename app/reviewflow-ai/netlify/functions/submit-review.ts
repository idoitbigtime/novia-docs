import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { classifyReview } from "./_shared/ai";
import { syncReviewToGHL } from "./_shared/ghlService";
import { ok, bad, parseBody } from "./_shared/http";

interface Body {
  business_slug: string;
  campaign_slug?: string;
  rating: number;
  text?: string;
  customer?: { full_name?: string | null; phone?: string | null; email?: string | null };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return bad("method not allowed", 405);
  const b = parseBody<Body>(event);
  if (!b.business_slug || !b.rating || b.rating < 1 || b.rating > 5) return bad("invalid input");

  const sb = getServiceSupabase();

  // resolve business
  const { data: biz } = await sb.from("businesses").select("id").eq("slug", b.business_slug).maybeSingle();
  if (!biz) return bad("business not found", 404);

  // resolve campaign (optional)
  let campaign_id: string | null = null;
  if (b.campaign_slug) {
    const { data: cmp } = await sb.from("campaigns").select("id")
      .eq("business_id", biz.id).eq("slug", b.campaign_slug).maybeSingle();
    campaign_id = cmp?.id ?? null;
  }

  // upsert customer if any identifying field exists
  let customer_id: string | null = null;
  if (b.customer && (b.customer.phone || b.customer.email)) {
    const { data: existing } = await sb.from("customers").select("id")
      .eq("business_id", biz.id)
      .or(`phone.eq.${b.customer.phone ?? "__"},email.eq.${b.customer.email ?? "__"}`)
      .limit(1).maybeSingle();
    if (existing) {
      customer_id = existing.id;
    } else {
      const { data: ins } = await sb.from("customers").insert({
        business_id: biz.id,
        full_name: b.customer.full_name ?? null,
        phone: b.customer.phone ?? null,
        email: b.customer.email ?? null,
      }).select("id").single();
      customer_id = ins?.id ?? null;
    }
  }

  // log a request row
  const { data: req } = await sb.from("review_requests").insert({
    business_id: biz.id, campaign_id,
    ip: (event.headers["x-forwarded-for"] || event.headers["x-nf-client-connection-ip"] || "")?.toString().split(",")[0] || null,
    user_agent: event.headers["user-agent"] ?? null,
  }).select("id").single();

  // classify
  const ai = await classifyReview({ rating: b.rating, text: b.text ?? null });

  // insert review
  const { data: review, error } = await sb.from("reviews").insert({
    business_id: biz.id,
    campaign_id,
    request_id: req?.id ?? null,
    customer_id,
    rating: b.rating,
    text: b.text ?? null,
    ai_sentiment: ai.sentiment,
    ai_route: ai.route,
    ai_confidence: ai.confidence,
    ai_summary: ai.summary,
    ai_suggested_response: ai.suggested_business_response,
    ai_tags: ai.tags,
    ai_raw: ai as any,
  }).select("id").single();
  if (error || !review) return bad(error?.message ?? "insert failed", 500);

  // fire-and-forget GHL sync (don't block customer UX)
  syncReviewToGHL({
    business_id: biz.id, review_id: review.id,
    rating: b.rating, text: b.text ?? null,
    sentiment: ai.sentiment, route: ai.route,
    customer: b.customer ?? null,
  }).catch(() => undefined);

  return ok({ review_id: review.id, route: ai.route, sentiment: ai.sentiment });
};
