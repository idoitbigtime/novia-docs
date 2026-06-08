import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import BrandedShell from "@/components/BrandedShell";
import { supabase } from "@/lib/supabase";
import type { BusinessBrand } from "@/lib/types";

interface CouponResult {
  status: string;
  code?: string;
  discount?: string;
  expiration?: string | null;
}

export default function CouponClaimed() {
  const { businessSlug } = useParams();
  const [params] = useSearchParams();
  const reviewId = params.get("review");

  const [business, setBusiness] = useState<BusinessBrand | null>(null);
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("public_business_brand").select("*").eq("slug", businessSlug).maybeSingle();
      setBusiness((data as BusinessBrand) ?? null);
    })();
  }, [businessSlug]);

  useEffect(() => {
    if (!reviewId) return;
    (async () => {
      try {
        const r = await fetch("/api/claim-coupon", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ review_id: reviewId }),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "כשל ביצירת קופון");
        setCoupon(j);
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, [reviewId]);

  return (
    <BrandedShell business={business}>
      <div className="card p-6 text-center flex flex-col gap-4">
        <div className="text-4xl">🎁</div>
        {!coupon && !error && <p>מכין את ההטבה שלך…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {coupon?.status === "pending" && (
          <>
            <h2 className="text-xl font-bold">תודה על הפרגון</h2>
            <p className="text-slate-600">
              ההטבה שלך ממתינה לאישור ותישלח אליך בוואטסאפ בקרוב.
            </p>
          </>
        )}
        {coupon?.status === "approved" && coupon.code && (
          <>
            <h2 className="text-xl font-bold">הנה הקופון שלך</h2>
            <div className="bg-slate-900 text-white rounded-2xl px-6 py-5 text-2xl font-mono tracking-widest">
              {coupon.code}
            </div>
            {coupon.discount && <p className="text-slate-700">{coupon.discount}</p>}
            {coupon.expiration && (
              <p className="text-slate-500 text-sm">בתוקף עד {coupon.expiration}</p>
            )}
          </>
        )}
      </div>
    </BrandedShell>
  );
}
