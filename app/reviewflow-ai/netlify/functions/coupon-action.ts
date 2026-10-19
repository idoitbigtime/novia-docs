// Dashboard coupon actions. Goes through the server so GHL events (coupon_approved /
// coupon_sent) are emitted via the outbox instead of silent client-side updates.
import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { requireUser, canEditBusiness } from "./_shared/authz";
import { enqueue, deliverNow } from "./_shared/outbox";
import { ok, fail, parseBody, preflight } from "./_shared/http";
import { isUuid } from "./_shared/validators";

type Action = "approve" | "reject" | "send" | "redeem";
interface Body { coupon_id?: string; action?: Action }

const TRANSITIONS: Record<Action, { from: string[]; to: string; stamp?: string }> = {
  approve: { from: ["pending"], to: "approved", stamp: "approved_at" },
  reject:  { from: ["pending", "approved"], to: "rejected" },
  send:    { from: ["approved"], to: "sent", stamp: "sent_at" },
  redeem:  { from: ["approved", "sent"], to: "redeemed", stamp: "redeemed_at" },
};

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);
  const user = await requireUser(event.headers as Record<string, string | undefined>);
  if (!user) return fail("UNAUTHORIZED", 401);

  const b = parseBody<Body>(event);
  if (!isUuid(b.coupon_id) || !b.action || !(b.action in TRANSITIONS)) return fail("INVALID_INPUT");

  const sb = getServiceSupabase();
  const { data: c } = await sb.from("coupons").select("*, reviews(rating, ai_route, contact_name, contact_phone), customers(full_name, phone, email, marketing_consent_at)")
    .eq("id", b.coupon_id).maybeSingle();
  if (!c) return fail("COUPON_NOT_FOUND", 404);
  if (!(await canEditBusiness(user, c.business_id))) return fail("FORBIDDEN", 403);

  const t = TRANSITIONS[b.action];
  if (!t.from.includes(c.status)) return fail("INVALID_INPUT", 409, { field: "status" });
  if (b.action === "redeem" && c.uses_count + 1 > c.max_uses) return fail("INVALID_INPUT", 409, { field: "max_uses" });

  const patch: Record<string, unknown> = { status: t.to };
  if (t.stamp) patch[t.stamp] = new Date().toISOString();
  if (b.action === "redeem") patch.uses_count = c.uses_count + 1;
  const { error } = await sb.from("coupons").update(patch).eq("id", c.id);
  if (error) return fail("INTERNAL", 500);

  if (b.action === "approve" || b.action === "send") {
    const cust: any = c.customers ?? {};
    const rev: any = c.reviews ?? {};
    const outboxId = await enqueue({
      business_id: c.business_id, review_id: c.review_id,
      event: b.action === "approve" ? "coupon_approved" : "coupon_sent",
      payload: {
        review_id: c.review_id, rating: rev.rating, route: rev.ai_route,
        coupon: { code: c.code, status: t.to, discount_type: c.discount_type, discount_value: c.discount_value, expiration_date: c.expiration_date },
        customer: { full_name: cust.full_name ?? rev.contact_name, phone: cust.phone ?? rev.contact_phone, email: cust.email, consent: !!cust.marketing_consent_at },
      },
    });
    await deliverNow(outboxId, 2000);
  }
  return ok({ ok: true, status: t.to });
};
