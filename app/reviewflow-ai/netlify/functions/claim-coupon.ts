import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { ok, fail, parseBody, preflight } from "./_shared/http";
import { isUuid } from "./_shared/validators";

// Coupons are created inside submit_review_tx for every route. This endpoint only
// re-reads one (direct link / refresh / manual-approval polling). It never creates.

interface Body { review_id?: string }

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);

  const b = parseBody<Body>(event);
  if (!isUuid(b.review_id)) return fail("INVALID_INPUT");

  const sb = getServiceSupabase();
  const { data: coupon } = await sb.from("coupons")
    .select("status, code, discount_type, discount_value, expiration_date, business_id")
    .eq("review_id", b.review_id).maybeSingle();
  if (!coupon) return fail("COUPON_NOT_FOUND", 404);

  const { data: settings } = await sb.from("coupon_settings").select("terms_text").eq("business_id", coupon.business_id).maybeSingle();

  return ok({
    status: coupon.status,
    code: coupon.status === "approved" || coupon.status === "sent" ? coupon.code : undefined,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    expiration_date: coupon.expiration_date,
    terms_text: settings?.terms_text ?? null,
  });
};
