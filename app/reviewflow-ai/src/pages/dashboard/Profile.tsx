import { FormEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import RequireBusiness from "@/components/RequireBusiness";
import { Button, PageState, useToast } from "@/components/ui";
import { brandForeground } from "@/components/BrandedShell";
import { toSlug } from "./Onboarding";

interface Biz { id: string; name: string; slug: string; logo_url: string | null; brand_color: string; welcome_text: string | null; is_active: boolean }

export default function ProfilePage() {
  return <RequireBusiness>{(b) => <ProfileInner businessId={b.id} onSaved={() => window.location.reload()} />}</RequireBusiness>;
}

function ProfileInner({ businessId, onSaved }: { businessId: string; onSaved: () => void }) {
  const toast = useToast();
  const [biz, setBiz] = useState<Biz | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("businesses").select("id, name, slug, logo_url, brand_color, welcome_text, is_active").eq("id", businessId).maybeSingle()
      .then(({ data }) => setBiz((data as Biz) ?? null));
  }, [businessId]);

  async function save(e: FormEvent) {
    e.preventDefault(); if (!biz) return;
    setSaving(true);
    const { error } = await supabase.from("businesses").update({ name: biz.name.trim(), slug: biz.slug, brand_color: biz.brand_color, welcome_text: biz.welcome_text || null }).eq("id", biz.id);
    setSaving(false);
    if (error) return toast(/unique|duplicate/i.test(error.message) ? "הכתובת כבר תפוסה" : "השמירה נכשלה", "err");
    toast("הפרופיל נשמר"); onSaved();
  }

  async function upload(file: File) {
    if (!biz) return;
    if (file.size > 2 * 1024 * 1024) return toast("הקובץ גדול מדי (עד 2MB)", "err");
    setUploading(true);
    const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
    const path = `${biz.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true, contentType: file.type || undefined, cacheControl: "3600" });
    if (error) { setUploading(false); return toast("ההעלאה נכשלה", "err"); }
    const { data: pub } = supabase.storage.from("logos").getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;
    const { error: e2 } = await supabase.from("businesses").update({ logo_url: url }).eq("id", biz.id);
    setUploading(false);
    if (e2) return toast("שמירת הלוגו נכשלה", "err");
    setBiz({ ...biz, logo_url: url }); toast("הלוגו עודכן");
  }

  async function removeLogo() {
    if (!biz) return;
    await supabase.from("businesses").update({ logo_url: null }).eq("id", biz.id);
    setBiz({ ...biz, logo_url: null }); toast("הלוגו הוסר");
  }

  if (!biz) return <PageState kind="loading" />;
  const fg = brandForeground(biz.brand_color);
  const origin = window.location.origin;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
      <form onSubmit={save} className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">פרופיל העסק</h1>
        <section className="card p-5 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {biz.logo_url ? <img src={biz.logo_url} alt="" className="h-16 w-16 rounded-2xl object-cover border border-slate-200 bg-white" />
              : <div className="h-16 w-16 rounded-2xl grid place-items-center text-2xl font-bold" style={{ backgroundColor: biz.brand_color, color: fg }}>{biz.name[0]}</div>}
            <div className="flex flex-col gap-1">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <div className="flex gap-2">
                <Button type="button" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>{biz.logo_url ? "החלפת לוגו" : "העלאת לוגו"}</Button>
                {biz.logo_url && <Button type="button" size="sm" onClick={removeLogo}>הסרה</Button>}
              </div>
              <span className="text-xs text-slate-400">PNG / JPG / WebP / SVG · עד 2MB · מרובע עדיף</span>
            </div>
          </div>
          <div><label className="label" htmlFor="pn">שם העסק</label><input id="pn" className="input" value={biz.name} onChange={(e) => setBiz({ ...biz, name: e.target.value })} required minLength={2} /></div>
          <div>
            <label className="label" htmlFor="ps">כתובת הדף</label>
            <div className="flex items-center gap-1 text-sm" dir="ltr"><span className="text-slate-400 whitespace-nowrap">{origin}/r/</span>
              <input id="ps" className="input" value={biz.slug} onChange={(e) => setBiz({ ...biz, slug: toSlug(e.target.value) })} /></div>
            <p className="text-xs text-amber-700 mt-1">שינוי הכתובת ישבור קודי QR שכבר הודפסו.</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="label mb-0" htmlFor="pc">צבע מותג</label>
            <input id="pc" type="color" value={biz.brand_color} onChange={(e) => setBiz({ ...biz, brand_color: e.target.value })} className="h-10 w-16 rounded-lg border border-slate-200 p-0.5" />
            <span className="text-sm text-slate-500" dir="ltr">{biz.brand_color}</span>
          </div>
          <div><label className="label" htmlFor="pw">טקסט פתיחה ללקוח</label><textarea id="pw" className="input min-h-[80px]" maxLength={300} value={biz.welcome_text ?? ""} onChange={(e) => setBiz({ ...biz, welcome_text: e.target.value })} /></div>
          <Button type="submit" variant="primary" loading={saving} className="self-start">שמירה</Button>
        </section>
      </form>

      <div className="hidden lg:block">
        <p className="text-sm text-slate-500 mb-2 mt-12">תצוגה מקדימה:</p>
        <div className="mx-auto w-[320px] rounded-[2rem] border-8 border-slate-900 bg-slate-50 p-4 shadow-xl">
          <div className="flex flex-col items-center text-center gap-2 mt-2">
            {biz.logo_url ? <img src={biz.logo_url} alt="" className="h-14 w-14 rounded-2xl object-cover bg-white" />
              : <div className="h-14 w-14 rounded-2xl grid place-items-center text-xl font-bold" style={{ backgroundColor: biz.brand_color, color: fg }}>{biz.name[0]}</div>}
            <div className="font-bold">{biz.name}</div>
            <div className="card p-4 w-full flex flex-col gap-3 mt-2">
              {biz.welcome_text && <p className="text-xs text-slate-600">{biz.welcome_text}</p>}
              <div className="text-yellow-400 text-2xl tracking-wider" aria-hidden="true">★★★★★</div>
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="rounded-xl py-2.5 text-sm font-medium" style={{ backgroundColor: biz.brand_color, color: fg }}>שליחה</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
