import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { triggerWebhook } from "./_shared/ghlService";
import { ok, bad, parseBody } from "./_shared/http";

interface Body { review_id: string; platform: string; url?: string; }

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return bad("method not allowed", 405);
  const b = parseBody<Body>(event);
  if (!b.review_id || !b.platform) return bad("invalid input");

  const sb = getServiceSupabase();
  const { data: review } = await sb.from("reviews").select("id, business_id").eq("id", b.review_id).maybeSingle();
  if (!review) return bad("review not found", 404);

  await sb.from("reviews").update({
    platform_clicked: b.platform,
    platform_clicked_at: new Date().toISOString(),
    verification_method: "click",
  }).eq("id", review.id);

  triggerWebhook(review.business_id, {
    event: "google_clicked", business_id: review.business_id, review_id: review.id, platform: b.platform,
  }).catch(() => undefined);

  return ok({ ok: true });
};
