import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { setActiveBusinessId } from "@/lib/businessContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import { brandForeground } from "@/components/BrandedShell";

// Hebrew → Latin transliteration so slugs stay printable on QR stickers / WhatsApp.
const HE: Record<string, string> = { א: "a", ב: "b", ג: "g", ד: "d", ה: "h", ו: "v", ז: "z", ח: "ch", ט: "t", י: "y", כ: "k", ך: "k", ל: "l", מ: "m", ם: "m", נ: "n", ן: "n", ס: "s", ע: "a", פ: "p", ף: "f", צ: "tz", ץ: "tz", ק: "k", ר: "r", ש: "sh", ת: "t" };
export function toSlug(input: string): string {
  return input.toLowerCase().split("").map((ch) => HE[ch] ?? ch).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [avail, setAvail] = useState<"idle" | "checking" | "free" | "taken">("idle");
  const [color, setColor] = useState("#6d28d9");
  const [welcome, setWelcome] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (!slugTouched) setSlug(toSlug(name)); }, [name, slugTouched]);

  useEffect(() => {
    if (!slug) { setAvail("idle"); return; }
    setAvail("checking");
    const t = setTimeout(async () => {
      // businesses is not readable by non-members; use the public RPC (returns null when free)
      const { data } = await supabase.rpc("public_business_page", { p_slug: slug });
      setAvail(data ? "taken" : "free");
    }, 400);
    return () => clearTimeout(t);
  }, [slug]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const { business } = await api.createBusiness({ name, slug: slug || undefined, brand_color: color, welcome_text: welcome || undefined });
      setActiveBusinessId(business.id);
      navigate("/app/platforms?welcome=1");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }

  const fg = brandForeground(color);
  const origin = window.location.origin;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">יצירת עסק חדש</h1>
        <p className="text-slate-500 mb-5 text-sm">שלב 1 מתוך 3 · אחר כך: קישורי פלטפורמות ← QR להדפסה.</p>
        <form onSubmit={onSubmit} className="card p-5 flex flex-col gap-4" noValidate>
          <div>
            <label className="label" htmlFor="bn">שם העסק</label>
            <input id="bn" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: פיצה רומא" required minLength={2} />
          </div>
          <div>
            <label className="label" htmlFor="bs">כתובת הדף (slug)</label>
            <div className="flex items-center gap-1 text-sm" dir="ltr">
              <span className="text-slate-400 whitespace-nowrap">{origin}/r/</span>
              <input id="bs" className="input" value={slug} onChange={(e) => { setSlugTouched(true); setSlug(toSlug(e.target.value)); }} placeholder="pizza-roma" />
            </div>
            <p className="text-xs mt-1 h-4" aria-live="polite">
              {avail === "checking" && <span className="text-slate-400">בודק זמינות…</span>}
              {avail === "free" && slug && <span className="text-emerald-600">✓ הכתובת פנויה</span>}
              {avail === "taken" && <span className="text-red-600">הכתובת תפוסה — תתווסף סיומת אוטומטית או בחרו אחרת</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="label mb-0" htmlFor="bc">צבע מותג</label>
            <input id="bc" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded-lg border border-slate-200 p-0.5" />
            <span className="text-sm text-slate-500" dir="ltr">{color}</span>
          </div>
          <div>
            <label className="label" htmlFor="bw">טקסט פתיחה ללקוח (לא חובה)</label>
            <textarea id="bw" className="input min-h-[80px]" value={welcome} maxLength={300} onChange={(e) => setWelcome(e.target.value)} placeholder="תודה שביקרתם אצלנו! נשמח לשמוע מה דעתכם 🙏" />
          </div>
          {err && <p role="alert" className="text-red-600 text-sm">{err}</p>}
          <Button type="submit" variant="primary" loading={busy} disabled={!name.trim()}>יצירת העסק והמשך ←</Button>
        </form>
      </div>

      {/* live preview of the customer page */}
      <div className="hidden lg:block">
        <p className="text-sm text-slate-500 mb-2">כך ייראה דף הלקוח:</p>
        <div className="mx-auto w-[320px] rounded-[2rem] border-8 border-slate-900 bg-slate-50 p-4 shadow-xl" style={{ ["--brand-color" as string]: color, ["--brand-fg" as string]: fg }}>
          <div className="flex flex-col items-center text-center gap-2 mt-2">
            <div className="h-14 w-14 rounded-2xl grid place-items-center text-xl font-bold" style={{ backgroundColor: color, color: fg }}>{name?.[0] || "★"}</div>
            <div className="font-bold">{name || "שם העסק"}</div>
            <div className="card p-4 w-full flex flex-col gap-3 mt-2">
              {welcome && <p className="text-xs text-slate-600">{welcome}</p>}
              <div className="text-yellow-400 text-2xl tracking-wider" aria-hidden="true">★★★★★</div>
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="rounded-xl py-2.5 text-sm font-medium" style={{ backgroundColor: color, color: fg }}>שליחה</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
