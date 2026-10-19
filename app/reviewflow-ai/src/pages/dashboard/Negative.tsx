import { useEffect, useState } from "react";
import { Phone, MessageCircle, Copy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RequireBusiness from "@/components/RequireBusiness";
import ReviewDrawer from "@/components/ReviewDrawer";
import StarRating from "@/components/StarRating";
import { Badge, Button, PageState, useToast } from "@/components/ui";
import { REVIEW_STATUS, ROUTE } from "@/lib/labels";
import { fmtDateTime } from "@/lib/format";
import { copyToClipboard, whatsappLink } from "@/lib/api";
import type { Review, ReviewStatus } from "@/lib/types";

type Tab = "open" | "manual" | "resolved";
const OPEN: ReviewStatus[] = ["new", "in_progress", "contacted"];

export default function NegativePage() {
  return <RequireBusiness>{(b) => <NegativeInner businessId={b.id} businessName={b.name} />}</RequireBusiness>;
}

function NegativeInner({ businessId, businessName }: { businessId: string; businessName: string }) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("open");
  const [rows, setRows] = useState<Array<Review & { customers: { full_name: string | null; phone: string | null; marketing_consent_at: string | null } | null }> | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [counts, setCounts] = useState({ open: 0, manual: 0, resolved: 0 });

  async function load() {
    let q = supabase.from("reviews").select("*, customers(full_name, phone, marketing_consent_at)").eq("business_id", businessId).order("created_at", { ascending: false }).limit(200);
    if (tab === "open") q = q.eq("ai_route", "recovery_flow").in("status", OPEN);
    if (tab === "manual") q = q.eq("ai_route", "manual_review").in("status", OPEN);
    if (tab === "resolved") q = q.in("ai_route", ["recovery_flow", "manual_review"]).in("status", ["resolved", "handled", "ignored"]);
    const { data } = await q;
    setRows((data ?? []) as any);
    const [a, b, c] = await Promise.all([
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("ai_route", "recovery_flow").in("status", OPEN),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("ai_route", "manual_review").in("status", OPEN),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("business_id", businessId).in("ai_route", ["recovery_flow", "manual_review"]).in("status", ["resolved", "handled", "ignored"]),
    ]);
    setCounts({ open: a.count ?? 0, manual: b.count ?? 0, resolved: c.count ?? 0 });
  }
  useEffect(() => { setRows(null); load(); /* eslint-disable-next-line */ }, [businessId, tab]);

  async function setStatus(id: string, status: ReviewStatus) {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    toast(error ? "העדכון נכשל" : "עודכן", error ? "err" : "ok"); load();
  }

  const tabs: Array<[Tab, string, number]> = [["open", "פתוחות", counts.open], ["manual", "לבדיקה", counts.manual], ["resolved", "טופלו", counts.resolved]];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ביקורות לטיפול</h1>
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 self-start">
        {tabs.map(([k, l, n]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${tab === k ? "bg-brand text-white" : "text-slate-600"}`}>
            {l}{n > 0 && <span className={`text-[11px] px-1.5 rounded-full ${tab === k ? "bg-white/25" : "bg-slate-100"}`}>{n}</span>}
          </button>
        ))}
      </div>

      {!rows ? <PageState kind="loading" /> : rows.length === 0 ? (
        <PageState kind="empty" title={tab === "resolved" ? "עדיין לא טופלו מקרים" : "אין מקרים פתוחים 🎉"} />
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => {
            const name = r.customers?.full_name || r.contact_name || "לקוח אנונימי";
            const phone = r.customers?.phone || r.contact_phone || null;
            const wa = whatsappLink(phone, `שלום ${r.customers?.full_name || r.contact_name || ""}, כאן ${businessName}. תודה על המשוב — `);
            return (
              <article key={r.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarRating value={r.rating} readOnly size={16} />
                    {r.ai_route && <Badge tone={ROUTE[r.ai_route].tone}>{ROUTE[r.ai_route].label}</Badge>}
                    <Badge tone={REVIEW_STATUS[r.status].tone}>{REVIEW_STATUS[r.status].label}</Badge>
                  </div>
                  <span className="text-xs text-slate-400">{fmtDateTime(r.created_at)}</span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-sm text-slate-600">
                      {phone ? <bdi dir="ltr">{phone}</bdi> : <span className="text-slate-400">אין טלפון</span>}
                      {r.best_time && <span className="text-slate-500"> · {r.best_time}</span>}
                    </div>
                  </div>
                  {phone && (
                    <div className="flex gap-2">
                      <a href={`tel:${phone}`} className="btn-ghost btn-sm"><Phone size={14} /> חיוג</a>
                      {wa && <a href={wa} target="_blank" rel="noopener" className="btn-primary btn-sm"><MessageCircle size={14} /> WhatsApp</a>}
                    </div>
                  )}
                </div>

                {r.text && <p className="text-slate-800">{r.text}</p>}
                {r.customer_message && <p className="text-sm text-slate-700"><span className="font-medium">מה קרה: </span>{r.customer_message}</p>}
                {r.ai_summary && <p className="text-sm text-slate-500"><span className="font-medium">תקציר: </span>{r.ai_summary}</p>}
                {r.ai_suggested_response && (
                  <div className="text-sm bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2">
                    <div className="flex-1"><span className="font-medium">תגובה מוצעת: </span>{r.ai_suggested_response}</div>
                    <button className="p-1.5 rounded-lg hover:bg-amber-100 shrink-0" aria-label="העתקת תגובה"
                      onClick={async () => toast((await copyToClipboard(r.ai_suggested_response!)) ? "הועתק" : "ההעתקה נכשלה")}><Copy size={16} /></button>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {OPEN.includes(r.status) ? (
                    <>
                      {r.status !== "in_progress" && <Button size="sm" onClick={() => setStatus(r.id, "in_progress")}>בטיפול</Button>}
                      {r.status !== "contacted" && <Button size="sm" onClick={() => setStatus(r.id, "contacted")}>יצרנו קשר</Button>}
                      <Button size="sm" variant="primary" onClick={() => setStatus(r.id, "resolved")}>סגור כטופל</Button>
                      <Button size="sm" onClick={() => setStatus(r.id, "ignored")}>סגור ללא טיפול</Button>
                    </>
                  ) : <Button size="sm" onClick={() => setStatus(r.id, "in_progress")}>פתח מחדש</Button>}
                  <Button size="sm" className="mr-auto" onClick={() => setOpen(r.id)}>פרטים מלאים</Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <ReviewDrawer reviewId={open} businessName={businessName} onClose={() => setOpen(null)} onChanged={load} />
    </div>
  );
}
