import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/businessContext";
import { GHL_SAFE_COLUMNS, type GhlSettingsSafe, type CouponSettings } from "@/lib/types";
import { apiError } from "@/lib/errors";

const emptyGhl = (business_id: string): GhlSettingsSafe => ({
  business_id, ghl_location_id: "", webhook_url: "",
  positive_tag: "reviewflow-positive", negative_tag: "reviewflow-negative",
  coupon_tag: "reviewflow-coupon", google_clicked_tag: "reviewflow-google-clicked",
  workflow_positive_id: "", workflow_negative_id: "", workflow_coupon_id: "",
  pipeline_id: "", opportunity_stage_negative: "", opportunity_stage_coupon_pending: "",
  is_enabled: false, has_api_key: false,
});

export default function SettingsPage() {
  const { business } = useActiveBusiness();
  const [ghl, setGhl] = useState<GhlSettingsSafe | null>(null);
  const [coupon, setCoupon] = useState<CouponSettings | null>(null);
  const [shareOnNegative, setShareOnNegative] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const [{ data: g }, { data: c }, { data: b }] = await Promise.all([
        supabase.from("ghl_settings").select(GHL_SAFE_COLUMNS).eq("business_id", business.id).maybeSingle(),
        supabase.from("coupon_settings").select("*").eq("business_id", business.id).maybeSingle(),
        supabase.from("businesses").select("share_on_negative").eq("id", business.id).maybeSingle(),
      ]);
      setShareOnNegative(!!(b as { share_on_negative?: boolean } | null)?.share_on_negative);
      setGhl((g as unknown as GhlSettingsSafe) ?? emptyGhl(business.id));
      setCoupon((c as CouponSettings) ?? {
        business_id: business.id, approval_mode: "auto", discount_type: "custom_text",
        discount_value: "הטבה מיוחדת בביקור הבא", expiry_days: 30, max_uses: 1,
        terms_text: "ההטבה ניתנת על מתן משוב, ללא קשר לפרסום ביקורת. תקפה לביקור הבא בלבד.",
      });
    })();
  }, [business?.id]);

  function flash(kind: "ok" | "err", text: string) { setMsg({ kind, text }); setTimeout(() => setMsg(null), 3500); }

  async function saveCoupon() {
    if (!coupon) return;
    setSaving(true);
    const { error } = await supabase.from("coupon_settings").upsert(coupon, { onConflict: "business_id" });
    setSaving(false);
    flash(error ? "err" : "ok", error ? "השמירה נכשלה" : "הגדרות ההטבה נשמרו");
  }

  async function saveFlow() {
    if (!business) return;
    setSaving(true);
    const { error } = await supabase.from("businesses").update({ share_on_negative: shareOnNegative }).eq("id", business.id);
    setSaving(false);
    flash(error ? "err" : "ok", error ? "השמירה נכשלה" : "הגדרות הזרימה נשמרו");
  }

  async function saveGhl() {
    if (!ghl) return;
    setSaving(true);
    const { has_api_key, ...writable } = ghl; // never send the key through this path
    const { error } = await supabase.from("ghl_settings").upsert(writable, { onConflict: "business_id" });
    if (error) { setSaving(false); flash("err", "השמירה נכשלה"); return; }

    if (apiKey.trim()) {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/set-ghl-key", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
        body: JSON.stringify({ business_id: ghl.business_id, api_key: apiKey.trim() }),
      });
      if (!res.ok) { setSaving(false); flash("err", await apiError(res)); return; }
      setGhl({ ...ghl, has_api_key: true });
      setApiKey("");
    }
    setSaving(false);
    flash("ok", "הגדרות GoHighLevel נשמרו");
  }

  if (!business || !ghl || !coupon) return <p className="text-slate-500">טוען…</p>;
  const g = (k: keyof GhlSettingsSafe) => (e: React.ChangeEvent<HTMLInputElement>) => setGhl({ ...ghl, [k]: e.target.value });

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold">הגדרות</h1>
      {msg && (
        <div role="status" className={`rounded-xl px-4 py-2 text-sm ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* ---------------- Customer flow ---------------- */}
      <section className="card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">זרימת הלקוח</h2>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" checked={shareOnNegative} onChange={(e) => setShareOnNegative(e.target.checked)} />
          <span>
            <span className="font-medium">להציג קישורי שיתוף (Google וכו׳) גם אחרי ביקורת שלילית</span>
            <span className="block text-sm text-slate-500 mt-0.5">
              כבוי (ברירת מחדל): לקוח לא מרוצה רואה רק טופס טיפול והטבה. שימו לב — הסתרה סלקטיבית של קישור Google לפי
              סנטימנט נחשבת ל-review gating לפי מדיניות Google; ההחלטה והאחריות על בעל העסק.
            </span>
          </span>
        </label>
        <button className="btn-primary self-start" disabled={saving} onClick={saveFlow}>שמירת הגדרות זרימה</button>
      </section>

      {/* ---------------- Coupon ---------------- */}
      <section className="card p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold">הטבה ללקוחות</h2>
        <p className="text-sm text-slate-500">ההטבה ניתנת על מתן משוב — לכל לקוח, ללא קשר לדירוג או לפרסום ביקורת.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">אישור</label>
            <select className="input" value={coupon.approval_mode}
              onChange={(e) => setCoupon({ ...coupon, approval_mode: e.target.value as "auto" | "manual" })}>
              <option value="auto">אוטומטי — הלקוח מקבל קוד מיד</option>
              <option value="manual" disabled>ידני — זמין אחרי חיבור GoHighLevel</option>
            </select>
          </div>
          <div>
            <label className="label">סוג הטבה</label>
            <select className="input" value={coupon.discount_type}
              onChange={(e) => setCoupon({ ...coupon, discount_type: e.target.value as CouponSettings["discount_type"] })}>
              <option value="custom_text">טקסט חופשי</option>
              <option value="percent">אחוז הנחה</option>
              <option value="fixed">סכום קבוע (₪)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label">{coupon.discount_type === "custom_text" ? "תיאור ההטבה" : "ערך"}</label>
            <input className="input" value={coupon.discount_value}
              onChange={(e) => setCoupon({ ...coupon, discount_value: e.target.value })}
              placeholder={coupon.discount_type === "percent" ? "10" : coupon.discount_type === "fixed" ? "20" : "קפה חינם בביקור הבא"} />
          </div>
          <div>
            <label className="label">תוקף (ימים)</label>
            <input className="input" type="number" min={1} max={365} value={coupon.expiry_days}
              onChange={(e) => setCoupon({ ...coupon, expiry_days: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">מספר מימושים</label>
            <input className="input" type="number" min={1} value={coupon.max_uses}
              onChange={(e) => setCoupon({ ...coupon, max_uses: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">תנאי ההטבה (מוצג ללקוח)</label>
            <textarea className="input min-h-[70px]" value={coupon.terms_text}
              onChange={(e) => setCoupon({ ...coupon, terms_text: e.target.value })} />
          </div>
        </div>
        <button className="btn-primary self-start" disabled={saving} onClick={saveCoupon}>שמירת הגדרות הטבה</button>
      </section>

      {/* ---------------- GHL ---------------- */}
      <section className="card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">GoHighLevel</h2>
          <span className={`text-xs px-2 py-1 rounded-lg ${ghl.is_enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
            {ghl.is_enabled ? "פעיל" : "מנותק"}
          </span>
        </div>
        <p className="text-sm text-slate-500">
          כל האירועים נרשמים ל-outbox גם כשהאינטגרציה מנותקת. ברגע שתפעילו ותזינו פרטים — הם יתחילו להישלח.
        </p>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={ghl.is_enabled} onChange={(e) => setGhl({ ...ghl, is_enabled: e.target.checked })} />
          <span>הפעלת האינטגרציה</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className="label">Location ID</label><input className="input" dir="ltr" value={ghl.ghl_location_id ?? ""} onChange={g("ghl_location_id")} /></div>
          <div>
            <label className="label">API Key {ghl.has_api_key && <span className="text-emerald-600 text-xs">••• מוגדר</span>}</label>
            <input className="input" dir="ltr" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder={ghl.has_api_key ? "להחלפה — הדביקו מפתח חדש" : "הדביקו מפתח"} autoComplete="off" />
          </div>
          <div className="md:col-span-2"><label className="label">Webhook URL (Inbound Webhook של workflow)</label>
            <input className="input" dir="ltr" value={ghl.webhook_url ?? ""} onChange={g("webhook_url")} placeholder="https://services.leadconnectorhq.com/hooks/..." /></div>
          <div><label className="label">תג — ביקורת חיובית</label><input className="input" dir="ltr" value={ghl.positive_tag ?? ""} onChange={g("positive_tag")} /></div>
          <div><label className="label">תג — ביקורת שלילית</label><input className="input" dir="ltr" value={ghl.negative_tag ?? ""} onChange={g("negative_tag")} /></div>
          <div><label className="label">תג — הטבה</label><input className="input" dir="ltr" value={ghl.coupon_tag ?? ""} onChange={g("coupon_tag")} /></div>
          <div><label className="label">תג — לחיצה על Google</label><input className="input" dir="ltr" value={ghl.google_clicked_tag ?? ""} onChange={g("google_clicked_tag")} /></div>
          <div><label className="label">Workflow — חיובי</label><input className="input" dir="ltr" value={ghl.workflow_positive_id ?? ""} onChange={g("workflow_positive_id")} /></div>
          <div><label className="label">Workflow — שלילי (התראת WhatsApp)</label><input className="input" dir="ltr" value={ghl.workflow_negative_id ?? ""} onChange={g("workflow_negative_id")} /></div>
          <div><label className="label">Workflow — שליחת הטבה</label><input className="input" dir="ltr" value={ghl.workflow_coupon_id ?? ""} onChange={g("workflow_coupon_id")} /></div>
          <div><label className="label">Pipeline ID</label><input className="input" dir="ltr" value={ghl.pipeline_id ?? ""} onChange={g("pipeline_id")} /></div>
          <div><label className="label">שלב — ביקורת שלילית</label><input className="input" dir="ltr" value={ghl.opportunity_stage_negative ?? ""} onChange={g("opportunity_stage_negative")} /></div>
          <div><label className="label">שלב — הטבה ממתינה</label><input className="input" dir="ltr" value={ghl.opportunity_stage_coupon_pending ?? ""} onChange={g("opportunity_stage_coupon_pending")} /></div>
        </div>
        <button className="btn-primary self-start" disabled={saving} onClick={saveGhl}>{saving ? "שומר…" : "שמירת הגדרות GoHighLevel"}</button>
      </section>
    </div>
  );
}
