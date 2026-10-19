import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import RequireBusiness from "@/components/RequireBusiness";
import ReviewDrawer from "@/components/ReviewDrawer";
import StarRating from "@/components/StarRating";
import { Badge, Button, PageState } from "@/components/ui";
import { ROUTE, SENTIMENT, REVIEW_STATUS } from "@/lib/labels";
import { fmtDate } from "@/lib/format";
import type { Review, ReviewRoute, ReviewStatus } from "@/lib/types";

const PAGE = 25;

export default function ReviewsPage() {
  return <RequireBusiness>{(b) => <ReviewsInner businessId={b.id} businessName={b.name} />}</RequireBusiness>;
}

function ReviewsInner({ businessId, businessName }: { businessId: string; businessName: string }) {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState<Review[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [route, setRoute] = useState<ReviewRoute | "">("");
  const [status, setStatus] = useState<ReviewStatus | "">("");
  const [rating, setRating] = useState<number | "">("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(params.get("review"));

  async function load() {
    let query = supabase.from("reviews").select("*", { count: "exact" }).eq("business_id", businessId)
      .order("created_at", { ascending: false }).range(page * PAGE, page * PAGE + PAGE - 1);
    if (route) query = query.eq("ai_route", route);
    if (status) query = query.eq("status", status);
    if (rating !== "") query = query.eq("rating", rating);
    if (q.trim()) query = query.or(`text.ilike.%${q.trim().replace(/[%,()]/g, "")}%,contact_name.ilike.%${q.trim().replace(/[%,()]/g, "")}%`);
    const { data, count } = await query;
    setRows((data ?? []) as Review[]); setTotal(count ?? 0);
  }
  useEffect(() => { setRows(null); load(); /* eslint-disable-next-line */ }, [businessId, page, route, status, rating, q]);

  function exportCsv() {
    if (!rows) return;
    const head = ["תאריך", "דירוג", "מסלול", "סטטוס", "שם", "טלפון", "טקסט", "תקציר"];
    const lines = rows.map((r) => [fmtDate(r.created_at), r.rating, r.ai_route ? ROUTE[r.ai_route].label : "", REVIEW_STATUS[r.status].label, r.contact_name ?? "", r.contact_phone ?? "", (r.text ?? "").replace(/"/g, "'"), (r.ai_summary ?? "").replace(/"/g, "'")]
      .map((v) => `"${String(v)}"`).join(","));
    const blob = new Blob(["﻿" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "reviews.csv"; a.click();
  }

  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">ביקורות <span className="text-base font-normal text-slate-400">({total})</span></h1>
        <Button size="sm" onClick={exportCsv} disabled={!rows?.length}>ייצוא CSV</Button>
      </div>

      <div className="card p-3 grid grid-cols-2 md:grid-cols-5 gap-2">
        <input className="input md:col-span-2" placeholder="חיפוש בטקסט / שם…" value={q} onChange={(e) => { setPage(0); setQ(e.target.value); }} />
        <select className="input" value={route} onChange={(e) => { setPage(0); setRoute(e.target.value as ReviewRoute | ""); }} aria-label="מסלול">
          <option value="">כל המסלולים</option>
          {(Object.keys(ROUTE) as ReviewRoute[]).map((k) => <option key={k} value={k}>{ROUTE[k].label}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => { setPage(0); setStatus(e.target.value as ReviewStatus | ""); }} aria-label="סטטוס">
          <option value="">כל הסטטוסים</option>
          {(["new", "in_progress", "contacted", "resolved", "ignored"] as ReviewStatus[]).map((k) => <option key={k} value={k}>{REVIEW_STATUS[k].label}</option>)}
        </select>
        <select className="input" value={rating} onChange={(e) => { setPage(0); setRating(e.target.value === "" ? "" : Number(e.target.value)); }} aria-label="דירוג">
          <option value="">כל הדירוגים</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
        </select>
      </div>

      {!rows ? <PageState kind="loading" /> : rows.length === 0 ? <PageState kind="empty" title="אין ביקורות תואמות" /> : (
        <>
          {/* mobile cards */}
          <ul className="md:hidden flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.id}>
                <button className="card w-full text-right p-3 flex flex-col gap-1.5 active:bg-slate-50" onClick={() => setOpen(r.id)}>
                  <div className="flex items-center justify-between">
                    <StarRating value={r.rating} readOnly size={16} />
                    <span className="text-xs text-slate-400">{fmtDate(r.created_at)}</span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {r.ai_route && <Badge tone={ROUTE[r.ai_route].tone}>{ROUTE[r.ai_route].label}</Badge>}
                    <Badge tone={REVIEW_STATUS[r.status].tone}>{REVIEW_STATUS[r.status].label}</Badge>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2">{r.ai_summary || r.text || <span className="text-slate-400">ללא טקסט</span>}</p>
                  {(r.contact_name || r.contact_phone) && <p className="text-xs text-slate-500">{r.contact_name} {r.contact_phone && <bdi dir="ltr">{r.contact_phone}</bdi>}</p>}
                </button>
              </li>
            ))}
          </ul>
          {/* desktop table */}
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 text-right font-medium">תאריך</th><th className="p-3 text-right font-medium">דירוג</th>
                  <th className="p-3 text-right font-medium">לקוח</th><th className="p-3 text-right font-medium">מסלול</th>
                  <th className="p-3 text-right font-medium">סנטימנט</th><th className="p-3 text-right font-medium">סטטוס</th>
                  <th className="p-3 text-right font-medium">תקציר</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setOpen(r.id)}>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                    <td className="p-3"><StarRating value={r.rating} readOnly size={14} /></td>
                    <td className="p-3 whitespace-nowrap">{r.contact_name || <span className="text-slate-400">—</span>}</td>
                    <td className="p-3">{r.ai_route ? <Badge tone={ROUTE[r.ai_route].tone}>{ROUTE[r.ai_route].label}</Badge> : "—"}</td>
                    <td className="p-3">{r.ai_sentiment ? <Badge tone={SENTIMENT[r.ai_sentiment].tone}>{SENTIMENT[r.ai_sentiment].label}</Badge> : "—"}</td>
                    <td className="p-3"><Badge tone={REVIEW_STATUS[r.status].tone}>{REVIEW_STATUS[r.status].label}</Badge></td>
                    <td className="p-3 max-w-md truncate">{r.ai_summary || r.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Button size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>הקודם</Button>
              <span className="text-slate-500">{page + 1} / {pages}</span>
              <Button size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>הבא</Button>
            </div>
          )}
        </>
      )}

      <ReviewDrawer reviewId={open} businessName={businessName}
        onClose={() => { setOpen(null); if (params.get("review")) { params.delete("review"); setParams(params, { replace: true }); } }}
        onChanged={load} />
    </div>
  );
}
