import { FormEvent, useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Trash2, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RequireBusiness from "@/components/RequireBusiness";
import { Badge, Button, PageState, useConfirm, useToast } from "@/components/ui";
import { PLATFORM_KIND } from "@/lib/labels";
import type { ReviewPlatform } from "@/lib/types";

const KINDS = Object.keys(PLATFORM_KIND);

export default function PlatformsPage() {
  return <RequireBusiness>{(b) => <PlatformsInner businessId={b.id} />}</RequireBusiness>;
}

function PlatformsInner({ businessId }: { businessId: string }) {
  const toast = useToast(); const confirm = useConfirm();
  const [rows, setRows] = useState<ReviewPlatform[] | null>(null);
  const [kind, setKind] = useState("google");
  const [name, setName] = useState("Google");
  const [url, setUrl] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");

  async function load() {
    const { data } = await supabase.from("review_platforms").select("*").eq("business_id", businessId).order("display_order");
    setRows((data ?? []) as ReviewPlatform[]);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [businessId]);

  const validUrl = (u: string) => { try { const x = new URL(u); return x.protocol === "https:" || x.protocol === "http:"; } catch { return false; } };

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!validUrl(url)) return toast("הקישור לא תקין (חייב להתחיל ב-https://)", "err");
    const { error } = await supabase.from("review_platforms").insert({ business_id: businessId, kind, display_name: name || PLATFORM_KIND[kind], review_url: url, display_order: (rows?.length ?? 0) + 1 });
    if (error) return toast("ההוספה נכשלה", "err");
    setUrl(""); setNameTouched(false); toast("הפלטפורמה נוספה"); load();
  }
  async function toggle(p: ReviewPlatform) {
    const { error } = await supabase.from("review_platforms").update({ is_active: !p.is_active }).eq("id", p.id);
    if (error) toast("העדכון נכשל", "err"); load();
  }
  async function remove(p: ReviewPlatform) {
    if (!(await confirm({ title: `למחוק את ${p.display_name}?`, text: "הכפתור ייעלם מדף הלקוח.", confirmLabel: "מחיקה", danger: true }))) return;
    const { error } = await supabase.from("review_platforms").delete().eq("id", p.id);
    toast(error ? "המחיקה נכשלה" : "נמחק", error ? "err" : "ok"); load();
  }
  async function move(i: number, dir: -1 | 1) {
    if (!rows) return; const j = i + dir; if (j < 0 || j >= rows.length) return;
    const a = rows[i], b = rows[j];
    await Promise.all([
      supabase.from("review_platforms").update({ display_order: j + 1 }).eq("id", a.id),
      supabase.from("review_platforms").update({ display_order: i + 1 }).eq("id", b.id),
    ]);
    load();
  }
  async function saveUrl(p: ReviewPlatform) {
    if (!validUrl(editUrl)) return toast("הקישור לא תקין", "err");
    const { error } = await supabase.from("review_platforms").update({ review_url: editUrl }).eq("id", p.id);
    toast(error ? "השמירה נכשלה" : "נשמר", error ? "err" : "ok"); setEditing(null); load();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">פלטפורמות ביקורת</h1>
      <p className="text-sm text-slate-500">הקישורים מוצגים לכל הלקוחות באופן זהה, ללא קשר לדירוג.</p>

      <form onSubmit={add} className="card p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="label" htmlFor="pk">סוג</label>
          <select id="pk" className="input" value={kind} onChange={(e) => { setKind(e.target.value); if (!nameTouched) setName(PLATFORM_KIND[e.target.value]); }}>
            {KINDS.map((k) => <option key={k} value={k}>{PLATFORM_KIND[k]}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="pn">שם להצגה</label><input id="pn" className="input" value={name} onChange={(e) => { setName(e.target.value); setNameTouched(true); }} /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="pu">קישור לכתיבת ביקורת</label><input id="pu" className="input" dir="ltr" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://g.page/r/…/review" required /></div>
        <Button type="submit" variant="primary" className="md:col-span-4">הוספה</Button>
      </form>

      {!rows ? <PageState kind="loading" /> : rows.length === 0 ? <PageState kind="empty" title="עדיין אין פלטפורמות" text="הוסיפו לפחות את קישור Google כדי שלקוחות יוכלו לשתף." /> : (
        <ul className="flex flex-col gap-2">
          {rows.map((p, i) => (
            <li key={p.id} className={`card p-3 flex flex-col sm:flex-row sm:items-center gap-3 ${p.is_active === false ? "opacity-60" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{p.display_name}</span>
                  <Badge>{PLATFORM_KIND[p.kind] ?? p.kind}</Badge>
                  {p.is_active === false && <Badge tone="warning">כבוי</Badge>}
                </div>
                {editing === p.id ? (
                  <div className="flex gap-2 mt-2">
                    <input className="input" dir="ltr" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
                    <Button size="sm" variant="primary" onClick={() => saveUrl(p)}>שמירה</Button>
                    <Button size="sm" onClick={() => setEditing(null)}>ביטול</Button>
                  </div>
                ) : (
                  <a className="text-xs text-brand truncate block mt-0.5" dir="ltr" href={p.review_url} target="_blank" rel="noopener noreferrer">{p.review_url}</a>
                )}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <Button size="sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="הזזה למעלה"><ArrowUp size={14} /></Button>
                <Button size="sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="הזזה למטה"><ArrowDown size={14} /></Button>
                <Button size="sm" onClick={() => { setEditing(p.id); setEditUrl(p.review_url); }}>עריכה</Button>
                <Button size="sm" onClick={() => toggle(p)}>{p.is_active === false ? "הפעלה" : "כיבוי"}</Button>
                <a className="btn-ghost btn-sm" href={p.review_url} target="_blank" rel="noopener noreferrer" aria-label="בדיקת קישור"><ExternalLink size={14} /></a>
                <Button size="sm" variant="danger" onClick={() => remove(p)} aria-label="מחיקה"><Trash2 size={14} /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
