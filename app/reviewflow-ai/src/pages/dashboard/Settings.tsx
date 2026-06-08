import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/businessContext";

interface GhlSettings {
  business_id: string;
  ghl_location_id: string | null;
  ghl_api_key: string | null;
  webhook_url: string | null;
  positive_tag: string | null;
  negative_tag: string | null;
  coupon_tag: string | null;
  google_clicked_tag: string | null;
  is_enabled: boolean;
}

export default function SettingsPage() {
  const { business } = useActiveBusiness();
  const [s, setS] = useState<GhlSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const { data } = await supabase.from("ghl_settings").select("*").eq("business_id", business.id).maybeSingle();
      setS((data as GhlSettings) ?? {
        business_id: business.id,
        ghl_location_id: "", ghl_api_key: "", webhook_url: "",
        positive_tag: "reviewflow-positive", negative_tag: "reviewflow-negative",
        coupon_tag: "reviewflow-coupon", google_clicked_tag: "reviewflow-google-clicked",
        is_enabled: false,
      });
    })();
  }, [business?.id]);

  async function save() {
    if (!s) return;
    setSaving(true);
    await supabase.from("ghl_settings").upsert(s, { onConflict: "business_id" });
    setSaving(false);
  }

  if (!business || !s) return null;
  const f = (k: keyof GhlSettings) => (e: any) => setS({ ...s, [k]: e.target.value });

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-2xl font-bold">הגדרות GoHighLevel</h1>
      <div className="card p-6 flex flex-col gap-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={s.is_enabled} onChange={(e) => setS({ ...s, is_enabled: e.target.checked })} />
          <span>אינטגרציה פעילה</span>
        </label>
        <div><label className="label">GHL Location ID</label><input className="input" value={s.ghl_location_id ?? ""} onChange={f("ghl_location_id")} /></div>
        <div><label className="label">API Key</label><input className="input" type="password" value={s.ghl_api_key ?? ""} onChange={f("ghl_api_key")} placeholder="••••••••" /></div>
        <div><label className="label">Webhook URL (אופציונלי)</label><input className="input" value={s.webhook_url ?? ""} onChange={f("webhook_url")} placeholder="https://hooks..." /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">תג חיובי</label><input className="input" value={s.positive_tag ?? ""} onChange={f("positive_tag")} /></div>
          <div><label className="label">תג שלילי</label><input className="input" value={s.negative_tag ?? ""} onChange={f("negative_tag")} /></div>
          <div><label className="label">תג קופון</label><input className="input" value={s.coupon_tag ?? ""} onChange={f("coupon_tag")} /></div>
          <div><label className="label">תג Google clicked</label><input className="input" value={s.google_clicked_tag ?? ""} onChange={f("google_clicked_tag")} /></div>
        </div>
        <button className="btn-primary" disabled={saving} onClick={save}>{saving ? "שומר…" : "שמירה"}</button>
      </div>
    </div>
  );
}
