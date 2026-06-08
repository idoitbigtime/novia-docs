import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { triggerWebhook } from "./_shared/ghlService";
import { ok, bad, parseBody } from "./_shared/http";

interface Body { review_id: string; name?: string; phone?: string; best_time?: string; details?: string; }

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return bad("method not allowed", 405);
  const b = parseBody<Body>(event);
  if (!b.review_id) return bad("invalid input");

  const sb = getServiceSupabase();
  const { data: review } = await sb.from("reviews").select("id, business_id, customer_id").eq("id", b.review_id).maybeSingle();
  if (!review) return bad("review not found", 404);

  // upsert customer details if not already attached
  let customer_id = review.customer_id;
  if (b.phone || b.name) {
    if (customer_id) {
      await sb.from("customers").update({
        full_name: b.name ?? undefined,
        phone: b.phone ?? undefined,
      }).eq("id", customer_id);
    } else {
      const { data: ins } = await sb.from("customers").insert({
        business_id: review.business_id,
        full_name: b.name ?? null, phone: b.phone ?? null,
      }).select("id").single();
      customer_id = ins?.id ?? null;
      if (customer_id) await sb.from("reviews").update({ customer_id }).eq("id", review.id);
    }
  }

  await sb.from("reviews").update({
    status: "in_progress",
    status_notes: [b.best_time ? `מועדף: ${b.best_time}` : "", b.details ?? ""].filter(Boolean).join(" — "),
  }).eq("id", review.id);

  triggerWebhook(review.business_id, {
    event: "manual_followup_required",
    business_id: review.business_id, review_id: review.id,
    customer_name: b.name, phone: b.phone, best_time: b.best_time, details: b.details,
  }).catch(() => undefined);

  return ok({ ok: true });
};
