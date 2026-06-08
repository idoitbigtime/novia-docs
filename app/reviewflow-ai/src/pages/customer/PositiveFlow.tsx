import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import BrandedShell from "@/components/BrandedShell";
import { supabase } from "@/lib/supabase";
import type { BusinessBrand, ReviewPlatform } from "@/lib/types";

export default function PositiveFlow() {
  const { businessSlug } = useParams();
  const [params] = useSearchParams();
  const reviewId = params.get("review");
  const navigate = useNavigate();

  const [business, setBusiness] = useState<BusinessBrand | null>(null);
  const [platforms, setPlatforms] = useState<ReviewPlatform[]>([]);
  const [clicked, setClicked] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: biz } = await supabase
        .from("public_business_brand").select("*").eq("slug", businessSlug).maybeSingle();
      setBusiness((biz as BusinessBrand) ?? null);
      if (biz) {
        const { data: pls } = await supabase
          .from("public_review_platforms").select("*")
          .eq("business_id", (biz as BusinessBrand).id)
          .order("display_order", { ascending: true });
        setPlatforms((pls as ReviewPlatform[]) ?? []);
      }
    })();
  }, [businessSlug]);

  async function recordClick(p: ReviewPlatform) {
    setClicked(p.kind);
    if (reviewId) {
      try {
        await fetch("/api/platform-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ review_id: reviewId, platform: p.kind, url: p.review_url }),
        });
      } catch { /* fire-and-forget */ }
    }
    window.open(p.review_url, "_blank", "noopener");
  }

  function onIPosted() {
    navigate(`/r/${businessSlug}/coupon?review=${reviewId ?? ""}`);
  }

  return (
    <BrandedShell business={business}>
      <div className="card p-6 flex flex-col gap-5 text-center">
        <div className="text-3xl">❤️</div>
        <h2 className="text-xl font-bold">איזה כיף לשמוע!</h2>
        <p className="text-slate-600">
          נשמח אם תפרסמו את חוות הדעת גם באחד המקומות הבאים.
          זה עוזר לנו מאוד להמשיך לתת שירות מעולה.
        </p>

        <div className="grid grid-cols-1 gap-3">
          {platforms.map((p) => (
            <button
              key={p.id}
              type="button"
              className="btn-ghost justify-between text-base py-3"
              onClick={() => recordClick(p)}
            >
              <span className="text-xl me-2">{p.icon ?? "⭐"}</span>
              <span className="flex-1 text-center">{p.display_name}</span>
            </button>
          ))}
          {platforms.length === 0 && (
            <p className="text-slate-400 text-sm">לא הוגדרו עדיין פלטפורמות.</p>
          )}
        </div>

        {clicked && (
          <button type="button" className="btn-primary mt-2" onClick={onIPosted}>
            פרסמתי — קבל את ההטבה 🎁
          </button>
        )}
      </div>
    </BrandedShell>
  );
}
