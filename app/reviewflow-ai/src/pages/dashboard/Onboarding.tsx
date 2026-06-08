import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { setActiveBusinessId } from "@/lib/businessContext";

function autoSlug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9֐-׿]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#6d28d9");
  const [welcome, setWelcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("צריך להתחבר מחדש");
      const res = await fetch("/api/create-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          brand_color: color,
          welcome_text: welcome || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "יצירת העסק נכשלה");
      setActiveBusinessId(json.business.id);
      navigate("/app");
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-1">יצירת עסק חדש</h1>
      <p className="text-slate-500 mb-6">הקמת עסק חדש במערכת. אחרי היצירה תקבל קישור QR ודשבורד משלך.</p>
      <form onSubmit={onSubmit} className="card p-6 flex flex-col gap-4">
        <div>
          <label className="label">שם העסק</label>
          <input className="input" value={name}
            onChange={(e) => { setName(e.target.value); if (!slug) setSlug(autoSlug(e.target.value)); }}
            placeholder="לדוגמה: פיצה רומא" required />
        </div>
        <div>
          <label className="label">כתובת (slug)</label>
          <div className="flex items-center gap-1 text-sm text-slate-500" dir="ltr">
            <span>/r/</span>
            <input className="input" value={slug} onChange={(e) => setSlug(autoSlug(e.target.value))} placeholder="pizza-roma" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="label mb-0">צבע מותג</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded-lg border border-slate-200" />
          <span className="text-sm text-slate-500">{color}</span>
        </div>
        <div>
          <label className="label">טקסט פתיחה ללקוח (אופציונלי)</label>
          <textarea className="input min-h-[80px]" value={welcome} onChange={(e) => setWelcome(e.target.value)}
            placeholder="תודה שביקרת אצלנו! נשמח לשמוע מה דעתך 🙏" />
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? "יוצר…" : "צור עסק"}</button>
      </form>
    </div>
  );
}
