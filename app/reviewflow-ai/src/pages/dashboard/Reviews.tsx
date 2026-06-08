import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/businessContext";
import type { Review } from "@/lib/types";

export default function ReviewsPage() {
  const { business } = useActiveBusiness();
  const [rows, setRows] = useState<Review[]>([]);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", business.id)
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data ?? []) as Review[]);
    })();
  }, [business?.id]);

  if (!business) return null;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ביקורות</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 text-right">תאריך</th>
              <th className="p-3 text-right">דירוג</th>
              <th className="p-3 text-right">סנטימנט</th>
              <th className="p-3 text-right">מסלול</th>
              <th className="p-3 text-right">סטטוס</th>
              <th className="p-3 text-right">תקציר</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3 text-slate-500">{new Date(r.created_at).toLocaleDateString("he-IL")}</td>
                <td className="p-3">{"★".repeat(r.rating)}</td>
                <td className="p-3">
                  <SentimentBadge s={r.ai_sentiment} />
                </td>
                <td className="p-3 text-slate-600">{r.ai_route ?? "—"}</td>
                <td className="p-3"><StatusBadge s={r.status} /></td>
                <td className="p-3 max-w-md truncate">{r.ai_summary ?? r.text}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">אין ביקורות עדיין</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SentimentBadge({ s }: { s: Review["ai_sentiment"] }) {
  if (!s) return <span className="text-slate-400">—</span>;
  const map: Record<string, string> = {
    positive: "bg-emerald-100 text-emerald-700",
    neutral:  "bg-slate-100 text-slate-700",
    negative: "bg-red-100 text-red-700",
  };
  return <span className={`text-xs px-2 py-1 rounded-lg ${map[s]}`}>{s}</span>;
}
function StatusBadge({ s }: { s: Review["status"] }) {
  return <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{s}</span>;
}
