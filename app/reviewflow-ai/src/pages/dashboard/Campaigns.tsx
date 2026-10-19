import { FormEvent, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Download, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RequireBusiness from "@/components/RequireBusiness";
import { Badge, Button, PageState, useConfirm, useToast } from "@/components/ui";
import { copyToClipboard } from "@/lib/api";
import { fmtNumber } from "@/lib/format";

interface Campaign { id: string; name: string; slug: string; source: string | null; is_active: boolean; created_at: string }
const SOURCES: Record<string, string> = { qr: "QR / מדבקה", whatsapp: "וואטסאפ", sms: "SMS", email: "אימייל", nfc: "NFC", link: "קישור" };

export default function CampaignsPage() {
  return <RequireBusiness>{(b) => <CampaignsInner businessId={b.id} slug={b.slug} />}</RequireBusiness>;
}

function CampaignsInner({ businessId, slug }: { businessId: string; slug: string }) {
  const toast = useToast(); const confirm = useConfirm();
  const [rows, setRows] = useState<Campaign[] | null>(null);
  const [stats, setStats] = useState<Record<string, { visits: number; reviews: number }>>({});
  const [name, setName] = useState(""); const [cslug, setCslug] = useState(""); const [source, setSource] = useState("qr");
  const [touched, setTouched] = useState(false);

  useEffect(() => { if (!touched) setCslug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30)); }, [name, touched]);

  async function load() {
    const { data } = await supabase.from("campaigns").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
    const list = (data ?? []) as Campaign[]; setRows(list);
    const [{ data: v }, { data: r }] = await Promise.all([
      supabase.from("review_requests").select("campaign_id").eq("business_id", businessId).not("campaign_id", "is", null),
      supabase.from("reviews").select("campaign_id").eq("business_id", businessId).not("campaign_id", "is", null),
    ]);
    const s: Record<string, { visits: number; reviews: number }> = {};
    (v ?? []).forEach((x: any) => { s[x.campaign_id] = s[x.campaign_id] ?? { visits: 0, reviews: 0 }; s[x.campaign_id].visits++; });
    (r ?? []).forEach((x: any) => { s[x.campaign_id] = s[x.campaign_id] ?? { visits: 0, reviews: 0 }; s[x.campaign_id].reviews++; });
    setStats(s);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [businessId]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !cslug) return;
    const { error } = await supabase.from("campaigns").insert({ business_id: businessId, name: name.trim(), slug: cslug, source });
    if (error) return toast(/unique|duplicate/i.test(error.message) ? "תג המקור כבר קיים" : "ההוספה נכשלה", "err");
    setName(""); setCslug(""); setTouched(false); toast("הקמפיין נוצר"); load();
  }
  async function toggle(c: Campaign) { await supabase.from("campaigns").update({ is_active: !c.is_active }).eq("id", c.id); load(); }
  async function remove(c: Campaign) {
    if (!(await confirm({ title: `למחוק את "${c.name}"?`, text: "קודים שהודפסו עם התג הזה ימשיכו לעבוד אבל לא יזוהו כמקור.", confirmLabel: "מחיקה", danger: true }))) return;
    await supabase.from("campaigns").delete().eq("id", c.id); toast("נמחק"); load();
  }
  const urlFor = (c: Campaign) => `${window.location.origin}/r/${slug}?c=${encodeURIComponent(c.slug)}`;
  function downloadSvg(c: Campaign) {
    const svg = document.getElementById(`qr-${c.id}`); if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `qr-${slug}-${c.slug}.svg`; a.click();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">קמפיינים ומקורות</h1>
      <p className="text-sm text-slate-500">כל מקור מקבל QR/קישור משלו, כדי שתדעו מאיפה מגיעים המשובים: שולחנות, קופה, הודעת וואטסאפ, חשבונית.</p>

      <form onSubmit={add} className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div><label className="label" htmlFor="cn">שם</label><input id="cn" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="שולחן 5 / קופה / וואטסאפ" required /></div>
        <div><label className="label" htmlFor="cs">תג (באנגלית)</label><input id="cs" className="input" dir="ltr" value={cslug} onChange={(e) => { setTouched(true); setCslug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-")); }} placeholder="table-5" required /></div>
        <div><label className="label" htmlFor="csrc">ערוץ</label><select id="csrc" className="input" value={source} onChange={(e) => setSource(e.target.value)}>{Object.entries(SOURCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <Button type="submit" variant="primary">יצירה</Button>
      </form>

      {!rows ? <PageState kind="loading" /> : rows.length === 0 ? <PageState kind="empty" title="עדיין אין קמפיינים" text="צרו תג ראשון, למשל 'שולחנות' או 'וואטסאפ'." /> : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map((c) => (
            <li key={c.id} className={`card p-4 flex gap-4 ${!c.is_active ? "opacity-60" : ""}`}>
              <div className="shrink-0 bg-white rounded-lg p-1 border border-slate-100"><QRCodeSVG id={`qr-${c.id}`} value={urlFor(c)} size={96} level="M" /></div>
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap"><span className="font-medium">{c.name}</span><Badge>{SOURCES[c.source ?? ""] ?? c.source ?? "—"}</Badge>{!c.is_active && <Badge tone="warning">כבוי</Badge>}</div>
                <a className="text-xs text-brand truncate" dir="ltr" href={urlFor(c)} target="_blank" rel="noopener">{urlFor(c)}</a>
                <div className="text-xs text-slate-500">{fmtNumber(stats[c.id]?.visits ?? 0)} ביקורים · {fmtNumber(stats[c.id]?.reviews ?? 0)} משובים</div>
                <div className="flex gap-1 flex-wrap mt-1">
                  <Button size="sm" onClick={async () => toast((await copyToClipboard(urlFor(c))) ? "הועתק" : "נכשל")}><Copy size={14} /> קישור</Button>
                  <Button size="sm" onClick={() => downloadSvg(c)}><Download size={14} /> SVG</Button>
                  <Button size="sm" onClick={() => toggle(c)}>{c.is_active ? "כיבוי" : "הפעלה"}</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(c)} aria-label="מחיקה"><Trash2 size={14} /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
