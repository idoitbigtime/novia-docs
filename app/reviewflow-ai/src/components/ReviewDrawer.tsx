import { useEffect, useState } from "react";
import { X, Phone, MessageCircle, Copy, RefreshCw, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { api, copyToClipboard, whatsappLink } from "@/lib/api";
import { Badge, Button, useToast } from "@/components/ui";
import StarRating from "@/components/StarRating";
import { ROUTE, SENTIMENT, REVIEW_STATUS, COUPON_STATUS, OUTBOX_STATUS } from "@/lib/labels";
import { fmtDateTime } from "@/lib/format";
import type { Review, ReviewStatus, Coupon, Customer } from "@/lib/types";

interface Props { reviewId: string | null; businessName: string; onClose: () => void; onChanged?: () => void }

export default function ReviewDrawer({ reviewId, businessName, onClose, onChanged }: Props) {
  const toast = useToast();
  const [r, setR] = useState<Review | null>(null);
  const [cust, setCust] = useState<Customer | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; event: string; status: string; created_at: string; last_error: string | null }>>([]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    if (!reviewId) return;
    const [{ data: rev }, { data: cp }, { data: ev }] = await Promise.all([
      supabase.from("reviews").select("*").eq("id", reviewId).maybeSingle(),
      supabase.from("coupons").select("*").eq("review_id", reviewId).maybeSingle(),
      supabase.from("outbox").select("id, event, status, created_at, last_error").eq("review_id", reviewId).order("created_at", { ascending: false }).limit(10),
    ]);
    setR(rev as Review); setCoupon((cp as Coupon) ?? null); setEvents((ev as any) ?? []);
    setNotes((rev as Review)?.status_notes ?? "");
    if ((rev as Review)?.customer_id) {
      const { data: c } = await supabase.from("customers").select("*").eq("id", (rev as Review).customer_id!).maybeSingle();
      setCust((c as Customer) ?? null);
    } else setCust(null);
  }
  useEffect(() => { setR(null); load(); /* eslint-disable-next-line */ }, [reviewId]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!reviewId) return null;

  const name = cust?.full_name || r?.contact_name || "לקוח אנונימי";
  const phone = cust?.phone || r?.contact_phone || null;
  const wa = whatsappLink(phone, `שלום ${cust?.full_name || r?.contact_name || ""}, כאן ${businessName}. תודה על המשוב ששלחת — `);

  async function setStatus(status: ReviewStatus) {
    if (!r) return; setBusy("status");
    const { error } = await supabase.from("reviews").update({ status }).eq("id", r.id);
    setBusy(null);
    if (error) return toast("העדכון נכשל", "err");
    toast("הסטטוס עודכן"); load(); onChanged?.();
  }
  async function saveNotes() {
    if (!r) return; setBusy("notes");
    const { error } = await supabase.from("reviews").update({ status_notes: notes }).eq("id", r.id);
    setBusy(null); toast(error ? "השמירה נכשלה" : "ההערות נשמרו", error ? "err" : "ok");
  }
  async function regen(tone?: "warm" | "formal" | "short") {
    if (!r) return; setBusy("regen");
    try { await api.regenerateReply(r.id, tone); toast("נוצרה תגובה חדשה"); load(); } catch (e: any) { toast(e.message, "err"); } finally { setBusy(null); }
  }
  async function resend() {
    if (!r) return; setBusy("resend");
    try { const res = await api.resendGhl(r.id); toast(res.status === "sent" ? "נשלח ל-GoHighLevel" : res.status === "skipped" ? "GoHighLevel לא מחובר — האירוע נשמר" : "נוסף לתור שליחה"); load(); }
    catch (e: any) { toast(e.message, "err"); } finally { setBusy(null); }
  }
  async function couponAct(action: "approve" | "reject" | "send" | "redeem") {
    if (!coupon) return; setBusy("coupon");
    try { await api.couponAction(coupon.id, action); toast("ההטבה עודכנה"); load(); onChanged?.(); } catch (e: any) { toast(e.message, "err"); } finally { setBusy(null); }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex justify-start" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label="פרטי ביקורת"
        className="h-full w-full sm:max-w-lg bg-white shadow-xl overflow-y-auto p-5 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{name}</h2>
            <p className="text-xs text-slate-500">{r ? fmtDateTime(r.created_at) : ""}</p>
          </div>
          <button className="p-2 rounded-lg hover:bg-slate-100" aria-label="סגירה" onClick={onClose}><X size={20} /></button>
        </div>

        {!r ? <div className="h-40 rounded-xl bg-slate-100 animate-pulse" /> : (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <StarRating value={r.rating} readOnly size={20} />
              {r.ai_route && <Badge tone={ROUTE[r.ai_route].tone}>{ROUTE[r.ai_route].label}</Badge>}
              {r.ai_sentiment && <Badge tone={SENTIMENT[r.ai_sentiment].tone}>{SENTIMENT[r.ai_sentiment].label}</Badge>}
              <Badge tone={REVIEW_STATUS[r.status].tone}>{REVIEW_STATUS[r.status].label}</Badge>
              {r.ai_fallback_used && <Badge>ללא AI</Badge>}
            </div>

            {r.text && <blockquote className="rounded-xl bg-slate-50 p-3 text-slate-800 whitespace-pre-wrap">{r.text}</blockquote>}
            {r.ai_summary && <p className="text-sm text-slate-600"><span className="font-medium">תקציר: </span>{r.ai_summary}</p>}
            {r.ai_tags?.length > 0 && <div className="flex gap-1 flex-wrap">{r.ai_tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>}

            {/* contact */}
            <section className="rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
              <h3 className="font-medium text-sm">יצירת קשר</h3>
              <div className="text-sm text-slate-700">
                {phone ? <bdi dir="ltr">{phone}</bdi> : <span className="text-slate-400">לא נמסר טלפון</span>}
                {cust?.email && <> · <bdi dir="ltr">{cust.email}</bdi></>}
                {r.best_time && <div className="text-xs text-slate-500">שעות מועדפות: {r.best_time}</div>}
                {r.customer_message && <div className="mt-1 text-slate-700 text-sm"><span className="font-medium">מה קרה: </span>{r.customer_message}</div>}
                <div className="text-[11px] text-slate-400 mt-1">{cust?.marketing_consent_at ? "✓ הסכמה ליצירת קשר" : "✗ ללא הסכמה לדיוור — פנייה רק בנוגע לפנייה עצמה"}</div>
              </div>
              {phone && (
                <div className="flex gap-2">
                  <a href={`tel:${phone}`} className="btn-ghost btn-sm"><Phone size={14} /> חיוג</a>
                  {wa && <a href={wa} target="_blank" rel="noopener" className="btn-ghost btn-sm"><MessageCircle size={14} /> WhatsApp</a>}
                </div>
              )}
            </section>

            {/* reply */}
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex flex-col gap-2">
              <h3 className="font-medium text-sm">תגובה מוצעת</h3>
              <p className="text-sm whitespace-pre-wrap">{r.ai_suggested_response || <span className="text-slate-400">אין עדיין</span>}</p>
              <div className="flex gap-2 flex-wrap">
                {r.ai_suggested_response && <Button size="sm" onClick={async () => toast((await copyToClipboard(r.ai_suggested_response!)) ? "הועתק" : "ההעתקה נכשלה")}><Copy size={14} /> העתקה</Button>}
                <Button size="sm" loading={busy === "regen"} onClick={() => regen("warm")}><RefreshCw size={14} /> חם</Button>
                <Button size="sm" loading={busy === "regen"} onClick={() => regen("formal")}>רשמי</Button>
                <Button size="sm" loading={busy === "regen"} onClick={() => regen("short")}>קצר</Button>
              </div>
            </section>

            {/* status */}
            <section className="flex flex-col gap-2">
              <h3 className="font-medium text-sm">סטטוס טיפול</h3>
              <div className="flex gap-2 flex-wrap">
                {(["in_progress", "contacted", "resolved", "ignored"] as ReviewStatus[]).map((s) => (
                  <Button key={s} size="sm" variant={s === "resolved" ? "primary" : "ghost"} disabled={r.status === s} loading={busy === "status"} onClick={() => setStatus(s)}>
                    {REVIEW_STATUS[s].label}
                  </Button>
                ))}
              </div>
              <textarea className="input min-h-[70px]" placeholder="הערות צוות פנימיות…" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <Button size="sm" loading={busy === "notes"} onClick={saveNotes} className="self-start">שמירת הערות</Button>
            </section>

            {/* coupon */}
            <section className="rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
              <h3 className="font-medium text-sm">הטבה</h3>
              {coupon ? (
                <>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <bdi dir="ltr" className="font-mono">{coupon.code}</bdi>
                    <Badge tone={COUPON_STATUS[coupon.status].tone}>{COUPON_STATUS[coupon.status].label}</Badge>
                    <span className="text-slate-500">{coupon.discount_value}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {coupon.status === "pending" && <Button size="sm" variant="primary" loading={busy === "coupon"} onClick={() => couponAct("approve")}>אישור</Button>}
                    {coupon.status === "approved" && <Button size="sm" loading={busy === "coupon"} onClick={() => couponAct("send")}><Send size={14} /> סימון נשלח</Button>}
                    {(coupon.status === "approved" || coupon.status === "sent") && <Button size="sm" loading={busy === "coupon"} onClick={() => couponAct("redeem")}>סימון מומש</Button>}
                    {(coupon.status === "pending" || coupon.status === "approved") && <Button size="sm" variant="danger" loading={busy === "coupon"} onClick={() => couponAct("reject")}>ביטול</Button>}
                  </div>
                </>
              ) : <p className="text-sm text-slate-400">אין הטבה</p>}
            </section>

            {/* integration log */}
            <section className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">GoHighLevel</h3>
                <Button size="sm" loading={busy === "resend"} onClick={resend}><Send size={14} /> שליחה ל-GHL</Button>
              </div>
              {events.length === 0 ? <p className="text-xs text-slate-400">אין אירועים</p> : (
                <ul className="text-xs text-slate-600 flex flex-col gap-1">
                  {events.map((e) => (
                    <li key={e.id} className="flex items-center gap-2">
                      <Badge tone={(OUTBOX_STATUS[e.status] ?? OUTBOX_STATUS.pending).tone}>{(OUTBOX_STATUS[e.status] ?? OUTBOX_STATUS.pending).label}</Badge>
                      <span dir="ltr" className="font-mono">{e.event}</span>
                      <span className="text-slate-400">{fmtDateTime(e.created_at)}</span>
                      {e.last_error && <span className="text-red-600 truncate" title={e.last_error}>{e.last_error}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </aside>
    </div>
  );
}
