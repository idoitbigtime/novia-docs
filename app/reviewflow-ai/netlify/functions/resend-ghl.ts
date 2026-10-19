// Re-queues a review's integration event (manual "send to GHL" from the dashboard).
import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { requireUser, canEditBusiness } from "./_shared/authz";
import { enqueue, deliverNow } from "./_shared/outbox";
import { loadSettings, isConfigured } from "./_shared/ghlService";
import { ok, fail, parseBody, preflight } from "./_shared/http";
import { isUuid } from "./_shared/validators";

interface Body { review_id?: string }

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);
  const user = await requireUser(event.headers as Record<string, string | undefined>);
  if (!user) return fail("UNAUTHORIZED", 401);

  const b = parseBody<Body>(event);
  if (!isUuid(b.review_id)) return fail("INVALID_INPUT");

  const sb = getServiceSupabase();
  const { data: r } = await sb.from("reviews")
    .select("id, business_id, rating, text, ai_sentiment, ai_route, ai_summary, contact_name, contact_phone, customers(full_name, phone, email, marketing_consent_at), coupons(code, status)")
    .eq("id", b.review_id).maybeSingle();
  if (!r) return fail("REVIEW_NOT_FOUND", 404);
  if (!(await canEditBusiness(user, r.business_id))) return fail("FORBIDDEN", 403);

  const settings = await loadSettings(r.business_id);
  if (!isConfigured(settings)) return fail("NOT_CONFIGURED", 409);

  const cust: any = r.customers ?? {};
  const coupon: any = Array.isArray(r.coupons) ? r.coupons[0] : r.coupons;
  const event_name = r.ai_route === "recovery_flow" ? "negative_review" : r.ai_route === "manual_review" ? "manual_followup_required" : "positive_review";
  const outboxId = await enqueue({
    business_id: r.business_id, review_id: r.id, event: event_name,
    payload: {
      review_id: r.id, rating: r.rating, text: r.text, sentiment: r.ai_sentiment, route: r.ai_route, summary: r.ai_summary, resend: true,
      customer: { full_name: cust.full_name ?? r.contact_name, phone: cust.phone ?? r.contact_phone, email: cust.email, consent: !!cust.marketing_consent_at },
      coupon: coupon ? { code: coupon.code, status: coupon.status } : null,
    },
  });
  await deliverNow(outboxId, 2500);
  const { data: row } = await sb.from("outbox").select("status, last_error").eq("id", outboxId ?? "").maybeSingle();
  return ok({ ok: true, status: row?.status ?? "pending", error: row?.last_error ?? null });
};
