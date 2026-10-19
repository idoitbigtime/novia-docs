import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BrandedShell from "@/components/BrandedShell";
import CouponBlock from "@/components/customer/CouponBlock";
import { fetchPublicPage, loadLastReview } from "@/lib/publicApi";
import { apiError } from "@/lib/errors";
import type { CustomerCoupon, PublicBusinessPage } from "@/lib/types";

/** Direct link / refresh view of a coupon (manual-approval polling). Never creates one. */
export default function CouponClaimed() {
  const { businessSlug = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const reviewId = params.get("review") || loadLastReview(businessSlug)?.review_id || null;

  const [page, setPage] = useState<PublicBusinessPage | null>(null);
  const [coupon, setCoupon] = useState<CustomerCoupon | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reviewId) { navigate(`/r/${businessSlug}`, { replace: true }); return; }
    fetchPublicPage(businessSlug).then(setPage).catch(() => setPage(null));
    (async () => {
      try {
        const r = await fetch("/api/claim-coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ review_id: reviewId }) });
        if (!r.ok) throw new Error(await apiError(r));
        setCoupon((await r.json()) as CustomerCoupon);
      } catch (e: any) { setError(e?.message ?? "שגיאה"); }
    })();
  }, [reviewId, businessSlug]);

  return (
    <BrandedShell business={page?.business ?? null}>
      {error ? <div className="card p-6 text-center text-red-600">{error}</div>
        : coupon ? <CouponBlock coupon={coupon} />
        : <div className="card p-6 animate-pulse h-40" aria-busy="true" />}
    </BrandedShell>
  );
}
