import { useState } from "react";
import type { CustomerCoupon } from "@/lib/types";
import { fmtDate, fmtDiscount } from "@/lib/format";

/**
 * Shown IDENTICALLY on every post-submit page (positive / recovery / neutral).
 * The reward is for giving feedback and is never conditioned on posting a review —
 * that is what keeps the flow compliant with Google's review policies.
 */
export default function CouponBlock({ coupon, phone }: { coupon: CustomerCoupon | null | undefined; phone?: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!coupon) return null;

  async function copy() {
    if (!coupon?.code) return;
    try { await navigator.clipboard.writeText(coupon.code); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  }

  const approved = coupon.status === "approved" || coupon.status === "sent";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center flex flex-col gap-3" aria-labelledby="coupon-h">
      <div className="text-3xl" aria-hidden="true">🎁</div>
      <h2 id="coupon-h" className="text-lg font-bold">ההטבה שלכם על המשוב</h2>
      <p className="text-slate-600 text-sm">{fmtDiscount(coupon.discount_type, coupon.discount_value)}</p>

      {approved && coupon.code ? (
        <>
          <button type="button" onClick={copy}
            className="mx-auto rounded-2xl px-6 py-4 text-2xl font-mono tracking-widest text-white"
            style={{ backgroundColor: "var(--brand-color)", color: "var(--brand-fg)" }}
            aria-label={`קוד ההטבה ${coupon.code}, לחיצה מעתיקה`}>
            <bdi dir="ltr">{coupon.code}</bdi>
          </button>
          <p className="text-xs text-slate-500" aria-live="polite">{copied ? "הקוד הועתק ✓" : "לחיצה על הקוד מעתיקה אותו · מומלץ לצלם מסך"}</p>
        </>
      ) : (
        <p className="text-slate-600 text-sm">
          ההטבה ממתינה לאישור העסק{phone ? ` ותישלח ל-${phone}` : ""} — בדרך כלל תוך 24 שעות.
        </p>
      )}

      <p className="text-[11px] text-slate-400 leading-relaxed">
        {coupon.terms_text ?? "ההטבה ניתנת על מתן משוב, ללא קשר לפרסום ביקורת."}
        {coupon.expiration_date ? ` · בתוקף עד ${fmtDate(coupon.expiration_date)}` : ""}
      </p>
    </section>
  );
}
