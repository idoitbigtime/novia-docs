import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { enqueue, deliverNow } from "./_shared/outbox";
import { ok, fail, parseBody, preflight } from "./_shared/http";
import { isUuid } from "./_shared/validators";

interface Body { review_id?: string; platform?: string }

const MAX_CLICKS_PER_REVIEW = 10;

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);

  const b = parseBody<Body>(event);
  if (!isUuid(b.review_id) || typeof b.platform !== "string") return fail("INVALID_INPUT");

  const sb = getServiceSupabase();
  const { data: review } = await sb.from("reviews")
    .select("id, business_id, click_count, rating, ai_route, contact_name, contact_phone")
    .eq("id", b.review_id).maybeSingle();
  if (!review) return fail("REVIEW_NOT_FOUND", 404);
  if ((review.click_count ?? 0) >= MAX_CLICKS_PER_REVIEW) return ok({ ok: true, throttled: true });

  // platform must be one the business actually configured
  const { data: platform } = await sb.from("review_platforms").select("kind")
    .eq("business_id", review.business_id).eq("kind", b.platform).eq("is_active", true).maybeSingle();
  if (!platform) return fail("INVALID_INPUT", 400, { field: "platform" });

  const now = new Date().toISOString();
  await Promise.all([
    sb.from("platform_clicks").insert({ business_id: review.business_id, review_id: review.id, platform: b.platform }),
    sb.from("reviews").update({
      platform_clicked: b.platform, platform_clicked_at: now, verification_method: "click",
      click_count: (review.click_count ?? 0) + 1,
    }).eq("id", review.id),
  ]);

  // Analytics-only event; GHL tag applies only to Google (and only once configured).
  const outboxId = await enqueue({
    business_id: review.business_id, review_id: review.id,
    event: b.platform === "google" ? "google_clicked" : "platform_clicked",
    payload: { review_id: review.id, platform: b.platform, rating: review.rating, route: review.ai_route,
               customer: { full_name: review.contact_name, phone: review.contact_phone, consent: false } },
  });
  await deliverNow(outboxId, 1500);

  return ok({ ok: true });
};
