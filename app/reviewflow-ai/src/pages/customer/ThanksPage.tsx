import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BrandedShell from "@/components/BrandedShell";
import CouponBlock from "@/components/customer/CouponBlock";
import SharePlatforms from "@/components/customer/SharePlatforms";
import { fetchPublicPage, loadLastReview, type LastReview } from "@/lib/publicApi";
import type { PublicBusinessPage } from "@/lib/types";

/**
 * Post-submit page for positive_flow and manual_review.
 * Layout is identical to RecoveryFlow: [CouponBlock] → [SharePlatforms] → done.
 */
export default function ThanksPage() {
  const { businessSlug = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState<PublicBusinessPage | null>(null);
  const [loading, setLoading] = useState(true);
  const last: LastReview | null = (location.state as LastReview | null) ?? loadLastReview(businessSlug);

  useEffect(() => {
    if (!last) { navigate(`/r/${businessSlug}`, { replace: true }); return; }
    fetchPublicPage(businessSlug).then(setPage).catch(() => setPage(null)).finally(() => setLoading(false));
  }, [businessSlug]);

  if (!last) return null;
  const neutral = last.route === "manual_review";

  return (
    <BrandedShell business={page?.business ?? null}>
      <div className="flex flex-col gap-4">
        <div className="card p-5 text-center">
          <div className="text-3xl mb-1" aria-hidden="true">{neutral ? "🙏" : "❤️"}</div>
          <h2 className="text-xl font-bold">{neutral ? "תודה על המשוב" : "איזה כיף לשמוע!"}</h2>
          <p className="text-slate-600 text-sm mt-1">
            {neutral ? "קיבלנו את הדברים ונלמד מהם." : "תודה שהקדשתם רגע — זה עוזר לנו להמשיך להשתפר."}
          </p>
        </div>

        <CouponBlock coupon={last.coupon} phone={last.phone} />
        <SharePlatforms platforms={page?.platforms ?? []} reviewId={last.review_id} loading={loading} />

        <p className="text-center text-sm text-slate-400 py-2">סיימנו — אפשר לסגור את העמוד. תודה!</p>
      </div>
    </BrandedShell>
  );
}
