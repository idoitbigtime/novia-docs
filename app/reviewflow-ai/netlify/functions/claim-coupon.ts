import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { triggerWebhook } from "./_shared/ghlService";
import { ok, bad, parseBody } from "./_shared/http";

interface Body { review_id: string; }

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return bad("method not allowed", 405);
  const b = parseBody<Body>(event);
  if (!b.review_id) return bad("invalid input");

  const sb = getServiceSupabase();
  const { data: review } = await sb
    .from("reviews")
    .select("id, business_id, customer_id, ai_route")
    .eq("id", b.review_id).maybeSingle();
  if (!review) return bad("review not found", 404);
  if (review.ai_route !== "positive_flow") return bad("coupon not available for this review", 403);

  // reuse existing coupon for this review if any
  const { data: existing } = await sb
    .from("coupons").select("*").eq("review_id", review.id).maybeSingle();
  if (existing) return ok(formatCoupon(existing));

  const { data: codeRow } = await sb.rpc("generate_coupon_code", { prefix: "RFAI" });
  const code = (codeRow as unknown as string) ?? `RFAI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const expires = new Date(); expires.setDate(expires.getDate() + 30);

  const { data: coupon, error } = await sb.from("coupons").insert({
    business_id: review.business_id,
    review_id: review.id,
    customer_id: review.customer_id,
    code,
    status: "pending",
    discount_type: "custom_text",
    discount_value: "הטבה שתשלח בוואטסאפ",
    expiration_date: expires.toISOString().slice(0, 10),
  }).select("*").single();
  if (error || !coupon) return bad(error?.message ?? "create coupon failed", 500);

  triggerWebhook(review.business_id, {
    event: "coupon_requested",
    business_id: review.business_id, review_id: review.id,
    coupon_id: coupon.id, code,
  }).catch(() => undefined);

  return ok(formatCoupon(coupon));
};

function formatCoupon(c: any) {
  return {
    status: c.status,
    code: c.status === "pending" ? undefined : c.code,
    discount: c.discount_value,
    expiration: c.expiration_date,
  };
}
