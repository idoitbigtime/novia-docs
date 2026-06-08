import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/businessContext";
import type { Review } from "@/lib/types";

export default function NegativePage() {
  const { business } = useActiveBusiness();
  const [rows, setRows] = useState<Review[]>([]);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("business_id", business.id)
        .eq("ai_route", "recovery_flow")
        .order("created_at", { ascending: false });
      setRows((data ?? []) as Review[]);
    })();
  }, [business?.id]);

  async function setStatus(r: Review, status: Review["status"]) {
    await supabase.from("reviews").update({ status }).eq("id", r.id);
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status } : x)));
  }

  if (!business) return null;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">ביקורות שליליות</h1>
      <div className="grid gap-3">
        {rows.map((r) => (
          <div key={r.id} className="card p-4 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="font-medium">{"★".repeat(r.rating)} <span className="text-slate-400 text-sm">{new Date(r.created_at).toLocaleString("he-IL")}</span></div>
              <span className="text-xs px-2 py-1 rounded-lg bg-slate-100">{r.status}</span>
            </div>
            <p className="text-slate-700">{r.text}</p>
            {r.ai_summary && <p className="text-sm text-slate-500"><b>סיכום AI:</b> {r.ai_summary}</p>}
            {r.ai_suggested_response && (
              <div className="text-sm bg-amber-50 p-3 rounded-xl">
                <b>תגובה מוצעת:</b> {r.ai_suggested_response}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              {r.status !== "in_progress" && <button className="btn-ghost" onClick={() => setStatus(r, "in_progress")}>בטיפול</button>}
              {r.status !== "contacted" && <button className="btn-ghost" onClick={() => setStatus(r, "contacted")}>יצרנו קשר</button>}
              {r.status !== "resolved" && <button className="btn-primary" onClick={() => setStatus(r, "resolved")}>סגור כטופל</button>}
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-400 text-center p-8">אין מקרים פתוחים 🎉</p>}
      </div>
    </div>
  );
}
