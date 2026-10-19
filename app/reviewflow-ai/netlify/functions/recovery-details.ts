import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { enqueue, deliverNow } from "./_shared/outbox";
import { ok, fail, parseBody, preflight } from "./_shared/http";
import { isUuid, clampText, normalizePhone, LIMITS } from "./_shared/validators";

interface Body { review_id?: string; name?: string; phone?: string; best_time?: string; details?: string; consent?: boolean }

const MAX_SUBMITS_PER_REVIEW = 3;

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);

  const b = parseBody<Body>(event);
  if (!isUuid(b.review_id)) return fail("INVALID_INPUT");

  const name = clampText(b.name, LIMITS.name);
  const phone = normalizePhone(b.phone);
  if (b.phone && !phone) return fail("INVALID_INPUT", 400, { field: "phone" });
  const best_time = clampText(b.best_time, LIMITS.bestTime);
  const details = clampText(b.details, LIMITS.message);

  const sb = getServiceSupabase();
  const { data: review } = await sb.from("reviews")
    .select("id, business_id, status, ai_route, rating, recovery_submits, ai_summary, customer_id")
    .eq("id", b.review_id).maybeSingle();
  if (!review) return fail("REVIEW_NOT_FOUND", 404);
  if (review.ai_route === "positive_flow") return fail("FORBIDDEN", 403);
  if ((review.recovery_submits ?? 0) >= MAX_SUBMITS_PER_REVIEW) return fail("RATE_LIMITED", 429);

  // IDOR-safe: we only ever write to THIS review's own contact fields, never to `customers`.
  const patch: Record<string, unknown> = {
    recovery_submits: (review.recovery_submits ?? 0) + 1,
    contact_name: name ?? undefined,
    contact_phone: phone ?? undefined,
    best_time: best_time ?? undefined,
    customer_message: details ?? undefined,
  };
  if (review.status === "new") patch.status = "in_progress";
  const { error } = await sb.from("reviews").update(patch).eq("id", review.id);
  if (error) return fail("INTERNAL", 500);

  // Record consent on the customer only when the customer explicitly ticks it here.
  if (b.consent === true && review.customer_id) {
    await sb.from("customers").update({ marketing_consent_at: new Date().toISOString() })
      .eq("id", review.customer_id).is("marketing_consent_at", null);
  }

  const outboxId = await enqueue({
    business_id: review.business_id, review_id: review.id, event: "manual_followup_required",
    payload: { review_id: review.id, rating: review.rating, route: review.ai_route, summary: review.ai_summary,
               text: details, best_time,
               customer: { full_name: name, phone, consent: b.consent === true } },
  });
  await deliverNow(outboxId, 2000);

  return ok({ ok: true });
};
