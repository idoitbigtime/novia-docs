import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import StarRating from "@/components/StarRating";
import BrandedShell from "@/components/BrandedShell";
import { fetchPublicPage, trackVisit, submitReview, saveLastReview } from "@/lib/publicApi";
import { apiError } from "@/lib/errors";
import type { PublicBusinessPage } from "@/lib/types";

type Load = { state: "loading" } | { state: "ready"; page: PublicBusinessPage } | { state: "notfound" } | { state: "error" };

export default function ReviewLanding() {
  const { businessSlug = "" } = useParams();
  const [params] = useSearchParams();
  const campaignSlug = params.get("c");
  const navigate = useNavigate();

  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const starsRef = useRef<HTMLDivElement>(null);

  async function loadPage() {
    setLoad({ state: "loading" });
    try {
      const page = await fetchPublicPage(businessSlug);
      setLoad(page ? { state: "ready", page } : { state: "notfound" });
      if (page) trackVisit(businessSlug, campaignSlug);
    } catch {
      setLoad({ state: "error" });
    }
  }
  useEffect(() => { loadPage(); /* eslint-disable-next-line */ }, [businessSlug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (load.state !== "ready") return;
    if (rating < 1) {
      setRatingError("נא לבחור דירוג");
      starsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setRatingError(null); setError(null); setSubmitting(true);
    const r = await submitReview({
      business_slug: businessSlug, campaign_slug: campaignSlug, rating, text, consent,
      customer: { full_name: name || null, phone: phone || null, email: email || null },
    });
    setSubmitting(false);
    if (!r.ok) { setError(await apiError(r.res)); return; }

    const last = { review_id: r.data.review_id, route: r.data.route, coupon: r.data.coupon, rating, name: name || null, phone: phone || null };
    saveLastReview(businessSlug, last);
    const dest = r.data.route === "recovery_flow" ? "recovery" : "thanks";
    navigate(`/r/${businessSlug}/${dest}`, { state: last });
  }

  if (load.state === "loading") {
    return <BrandedShell business={null}><div className="card p-6 animate-pulse h-72" aria-busy="true" /></BrandedShell>;
  }
  if (load.state === "notfound") {
    return <BrandedShell business={null}><div className="card p-6 text-center"><div className="text-3xl mb-2" aria-hidden="true">🔍</div><p className="font-medium">העסק לא נמצא</p><p className="text-sm text-slate-500 mt-1">בדקו שהקישור נכון או סרקו שוב את ה-QR.</p></div></BrandedShell>;
  }
  if (load.state === "error") {
    return <BrandedShell business={null}><div className="card p-6 text-center"><p className="font-medium">בעיית תקשורת</p><button className="btn-primary mt-3" onClick={loadPage}>נסו שוב</button></div></BrandedShell>;
  }

  const { business } = load.page;
  return (
    <BrandedShell business={business}>
      <form onSubmit={onSubmit} className="card p-5 sm:p-6 flex flex-col gap-5" noValidate>
        {business.welcome_text && <p className="text-center text-slate-700">{business.welcome_text}</p>}

        <div ref={starsRef}>
          <p className="text-center text-sm text-slate-500 mb-2">איך הייתה החוויה שלכם?</p>
          <StarRating value={rating} onChange={(v) => { setRating(v); setRatingError(null); }} />
          {ratingError && <p role="alert" className="text-red-600 text-sm text-center mt-1">{ratingError}</p>}
        </div>

        <div>
          <label className="label" htmlFor="fb">ספרו לנו עוד</label>
          <textarea id="fb" className="input min-h-[110px]" value={text} maxLength={2000}
            onChange={(e) => setText(e.target.value)} placeholder="מה אהבתם? מה אפשר לשפר?" />
        </div>

        <details className="group">
          <summary className="cursor-pointer text-sm text-slate-600 select-none list-none flex items-center gap-1">
            <span className="transition group-open:rotate-90" aria-hidden="true">›</span>
            פרטים ליצירת קשר (לא חובה — כדי שנוכל לחזור אליכם ולשלוח את ההטבה)
          </summary>
          <div className="grid grid-cols-1 gap-3 mt-3">
            <div><label className="label" htmlFor="nm">שם</label><input id="nm" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="label" htmlFor="ph">טלפון</label><input id="ph" className="input" dir="ltr" type="tel" inputMode="tel" autoComplete="tel" placeholder="050-0000000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><label className="label" htmlFor="em">אימייל</label><input id="em" className="input" dir="ltr" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
        </details>

        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>אני מאשר/ת ל{business.name} ליצור איתי קשר בנוגע למשוב ולהטבה (לרבות בוואטסאפ). אפשר לבטל בכל עת. <Link to="/privacy" className="underline" target="_blank">מדיניות פרטיות</Link></span>
        </label>

        {error && <p role="alert" className="text-red-600 text-sm text-center">{error}</p>}

        <button type="submit" className="btn-primary text-lg py-3" disabled={submitting} aria-busy={submitting}>
          {submitting ? "שולחים…" : "שליחה"}
        </button>
      </form>
    </BrandedShell>
  );
}
