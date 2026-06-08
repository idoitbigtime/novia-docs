import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/businessContext";
import type { Coupon } from "@/lib/types";

export default function CouponsPage() {
  const { business } = useActiveBusiness();
  const [rows, setRows] = useState<Coupon[]>([]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [business?.id]);

  async function load() {
    if (!business) return;
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data ?? []) as Coupon[]);
  }

  async function setStatus(c: Coupon, status: Coupon["status"]) {
    const patch: any = { status };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "sent") patch.sent_at = new Date().toISOString();
    if (status === "redeemed") patch.redeemed_at = new Date().toISOString();
    await supabase.from("coupons").update(patch).eq("id", c.id);
    load();
  }

  if (!business) return null;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">קופונים</h1>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 text-right">קוד</th>
              <th className="p-3 text-right">הטבה</th>
              <th className="p-3 text-right">סטטוס</th>
              <th className="p-3 text-right">תוקף</th>
              <th className="p-3 text-right">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="p-3 font-mono">{c.code}</td>
                <td className="p-3">{c.discount_type === "custom_text" ? c.discount_value :
                  c.discount_type === "percent" ? `${c.discount_value}%` : `₪${c.discount_value}`}</td>
                <td className="p-3"><span className="text-xs px-2 py-1 rounded-lg bg-slate-100">{c.status}</span></td>
                <td className="p-3 text-slate-500">{c.expiration_date ?? "—"}</td>
                <td className="p-3 flex gap-2">
                  {c.status === "pending"  && <button className="btn-primary" onClick={() => setStatus(c, "approved")}>אישור</button>}
                  {c.status === "approved" && <button className="btn-ghost" onClick={() => setStatus(c, "sent")}>סימון נשלח</button>}
                  {c.status === "sent"     && <button className="btn-ghost" onClick={() => setStatus(c, "redeemed")}>סימון נוצל</button>}
                  {c.status === "pending"  && <button className="btn-ghost" onClick={() => setStatus(c, "rejected")}>דחייה</button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">אין קופונים עדיין</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
