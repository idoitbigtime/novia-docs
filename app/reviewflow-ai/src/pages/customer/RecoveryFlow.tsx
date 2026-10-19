import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import BrandedShell from "@/components/BrandedShell";
import CouponBlock from "@/components/customer/CouponBlock";
import SharePlatforms from "@/components/customer/SharePlatforms";
import { fetchPublicPage, loadLastReview, type LastReview } from "@/lib/publicApi";
import { apiError } from "@/lib/errors";
import type { PublicBusinessPage } from "@/lib/types";

/**
 * Post-submit page for recovery_flow. Same blocks as ThanksPage (coupon + share),
 * plus an optional "let us make it right" form. Nothing here is conditioned on rating.
 */
export default function RecoveryFlow() {
  const { businessSlug = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const last: LastReview | null = (location.state as LastReview | null) ?? loadLastReview(businessSlug);

  const [page, setPage] = useState<PublicBusinessPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(last?.name ?? "");
  const [phone, setPhone] = useState(last?.phone ?? "");
  const [bestTime, setBestTime] = useState("");
  const [details, setDetails] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "skipped">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!last) { navigate(`/r/${businessSlug}`, { replace: true }); return; }
    fetchPublicPage(businessSlug).then(setPage).catch(() => setPage(null)).finally(() => setLoading(false));
  }, [businessSlug]);

  if (!last) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!last) return;
    setErr(null);
    if (!phone.trim()) { setErr("כדי שנוכל לחזור אליכם צריך מספר טלפון"); return; }
    setState("sending");
    try {
      const res = await fetch("/api/recovery-details", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: last.review_id, name, phone, best_time: bestTime, details, consent }),
      });
      if (!res.ok) throw new Error(await apiError(res));
      setState("sent");
    } catch (e: any) {
      setState("idle");
      setErr(e?.message || "השליחה נכשלה, נסו שוב");
    }
  }

  return (
    <BrandedShell business={page?.business ?? null}>
      <div className="flex flex-col gap-4">
        <div className="card p-5 text-center">
          <div className="text-3xl mb-1" aria-hidden="true">🙏</div>
          <h2 className="text-xl font-bold">תודה רבה על הכנות</h2>
          <p className="text-slate-600 text-sm mt-1">המשוב שלכם חשוב לנו מאוד ונלמד ממנו.</p>
        </div>

        {state === "sent" ? (
          <div className="card p-5 text-center text-emerald-700 bg-emerald-50 border-emerald-100">
            קיבלנו את הפרטים. נחזור אליכם בהקדם כדי לתקן את הרושם.
          </div>
        ) : state === "skipped" ? null : (
          <form onSubmit={onSubmit} className="card p-5 flex flex-col gap-3" noValidate>
            <p className="text-sm text-slate-700 font-medium">רוצים שנחזור אליכם? השאירו פרטים:</p>
            <div><label className="label" htmlFor="rn">שם</label><input id="rn" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="label" htmlFor="rp">טלפון</label><input id="rp" className="input" dir="ltr" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><label className="label" htmlFor="rt">מתי נוח לכם שנתקשר?</label><input id="rt" className="input" value={bestTime} onChange={(e) => setBestTime(e.target.value)} placeholder="למשל: אחה״צ" /></div>
            <div><label className="label" htmlFor="rd">מה קרה? (לא חובה)</label><textarea id="rd" className="input min-h-[90px]" maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} /></div>
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>מאשר/ת שיחזרו אליי (גם בוואטסאפ) בנוגע לפנייה הזו.</span>
            </label>
            {err && <p role="alert" className="text-red-600 text-sm">{err}</p>}
            <button type="submit" className="btn-primary" disabled={state === "sending"} aria-busy={state === "sending"}>
              {state === "sending" ? "שולחים…" : "שלחו לטיפול"}
            </button>
            <button type="button" className="text-sm text-slate-500 py-2" onClick={() => setState("skipped")}>
              לא צריך שיחזרו אליי
            </button>
          </form>
        )}

        <CouponBlock coupon={last.coupon} phone={phone || last.phone} />
        <SharePlatforms platforms={page?.platforms ?? []} reviewId={last.review_id} loading={loading} />

        <p className="text-center text-sm text-slate-400 py-2">סיימנו — אפשר לסגור את העמוד. תודה!</p>
      </div>
    </BrandedShell>
  );
}
