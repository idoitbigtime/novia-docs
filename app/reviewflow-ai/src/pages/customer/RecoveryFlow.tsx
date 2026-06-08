import { FormEvent, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import BrandedShell from "@/components/BrandedShell";
import { supabase } from "@/lib/supabase";
import type { BusinessBrand } from "@/lib/types";

export default function RecoveryFlow() {
  const { businessSlug } = useParams();
  const [params] = useSearchParams();
  const reviewId = params.get("review");

  const [business, setBusiness] = useState<BusinessBrand | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bestTime, setBestTime] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("public_business_brand").select("*").eq("slug", businessSlug).maybeSingle();
      setBusiness((data as BusinessBrand) ?? null);
    })();
  }, [businessSlug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reviewId) return;
    setSubmitting(true);
    await fetch("/api/recovery-details", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: reviewId, name, phone, best_time: bestTime, details }),
    });
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <BrandedShell business={business}>
      <div className="card p-6 flex flex-col gap-5">
        <div className="text-center">
          <div className="text-3xl mb-2">🙏</div>
          <h2 className="text-xl font-bold">תודה רבה על הכנות</h2>
          <p className="text-slate-600 mt-2">
            המשוב שלך חשוב לנו מאוד.<br/>
            נעביר את זה לטיפול ונעשה מאמץ לחזור אליך בהקדם.
          </p>
        </div>

        {submitted ? (
          <div className="text-center text-emerald-700 bg-emerald-50 rounded-xl p-4">
            הפרטים נשלחו. ניצור איתך קשר בהקדם.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <input className="input" placeholder="שם" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="input" placeholder="שעות מועדפות ליצירת קשר" value={bestTime} onChange={(e) => setBestTime(e.target.value)} />
            <textarea className="input min-h-[100px]" placeholder="מה קרה? (אופציונלי)" value={details} onChange={(e) => setDetails(e.target.value)} />
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "שולח…" : "שלח לטיפול"}
            </button>
          </form>
        )}
      </div>
    </BrandedShell>
  );
}
