import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import StarRating from "@/components/StarRating";
import BrandedShell from "@/components/BrandedShell";
import { supabase } from "@/lib/supabase";
import type { BusinessBrand } from "@/lib/types";

export default function ReviewLanding() {
  const { businessSlug } = useParams();
  const [params] = useSearchParams();
  const campaignSlug = params.get("c") ?? undefined;
  const navigate = useNavigate();

  const [business, setBusiness] = useState<BusinessBrand | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error: e } = await supabase
        .from("public_business_brand")
        .select("*")
        .eq("slug", businessSlug)
        .maybeSingle();
      if (cancelled) return;
      if (e) setError("שגיאה בטעינת העסק");
      setBusiness((data as BusinessBrand) ?? null);
    })();
    return () => { cancelled = true; };
  }, [businessSlug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!business) return;
    if (rating < 1) { setError("נא לבחור דירוג"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_slug: business.slug,
          campaign_slug: campaignSlug,
          rating,
          text,
          customer: { full_name: name || null, phone: phone || null, email: email || null },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "שליחה נכשלה");

      sessionStorage.setItem(
        `rf:lastReview:${business.slug}`,
        JSON.stringify({ id: json.review_id, route: json.route, rating }),
      );

      if (json.route === "positive_flow") {
        navigate(`/r/${business.slug}/thanks?review=${json.review_id}`);
      } else {
        navigate(`/r/${business.slug}/recovery?review=${json.review_id}`);
      }
    } catch (err: any) {
      setError(err.message ?? "שליחה נכשלה");
      setSubmitting(false);
    }
  }

  if (!business && !error) {
    return <BrandedShell business={null}><div className="text-center text-slate-500 py-12">טוען…</div></BrandedShell>;
  }
  if (!business && error) {
    return <BrandedShell business={null}><div className="card p-6 text-center">העסק לא נמצא</div></BrandedShell>;
  }

  return (
    <BrandedShell business={business}>
      <form onSubmit={onSubmit} className="card p-6 flex flex-col gap-5">
        {business?.welcome_text && (
          <p className="text-center text-slate-700">{business.welcome_text}</p>
        )}

        <div>
          <p className="text-center text-sm text-slate-500 mb-2">איך הייתה החוויה שלך?</p>
          <StarRating value={rating} onChange={setRating} />
        </div>

        <div>
          <label className="label">ספר/י לנו עוד</label>
          <textarea
            className="input min-h-[110px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="מה אהבת? מה אפשר לשפר?"
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <input className="input" placeholder="שם (אופציונלי)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="טלפון (אופציונלי)" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="input" placeholder="אימייל (אופציונלי)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <button type="submit" className="btn-primary text-lg py-3" disabled={submitting}>
          {submitting ? "שולח…" : "שליחה"}
        </button>
      </form>
    </BrandedShell>
  );
}
