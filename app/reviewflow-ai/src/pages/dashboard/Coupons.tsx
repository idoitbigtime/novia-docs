import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import RequireBusiness from "@/components/RequireBusiness";
import { Badge, Button, PageState, useConfirm, useToast } from "@/components/ui";
import { COUPON_STATUS } from "@/lib/labels";
import { fmtDate, fmtDiscount } from "@/lib/format";
import { api } from "@/lib/api";
import type { Coupon, CouponStatus } from "@/lib/types";

type Row = Coupon & { reviews: { rating: number; contact_name: string | null; contact_phone: string | null } | null; customers: { full_name: string | null; phone: string | null } | null };

export default function CouponsPage() {
  return <RequireBusiness>{(b) => <CouponsInner businessId={b.id} />}</RequireBusiness>;
}

function CouponsInner({ businessId }: { businessId: string }) {
  const toast = useToast(); const confirm = useConfirm();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<CouponStatus | "">("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    let q = supabase.from("coupons").select("*, reviews(rating, contact_name, contact_phone), customers(full_name, phone)")
      .eq("business_id", businessId).order("created_at", { ascending: false }).limit(300);
    if (filter) q = q.eq("status", filter);
    const { data } = await q; setRows((data ?? []) as Row[]);
  }
  useEffect(() => { setRows(null); load(); /* eslint-disable-next-line */ }, [businessId, filter]);

  async function act(c: Row, action: "approve" | "reject" | "send" | "redeem") {
    if (action === "reject" && !(await confirm({ title: "לבטל את ההטבה?", text: `קוד ${c.code} יסומן כנדחה.`, confirmLabel: "ביטול ההטבה", danger: true }))) return;
    setBusy(c.id);
    try { await api.couponAction(c.id, action); toast("ההטבה עודכנה"); await load(); } catch (e: any) { toast(e.message, "err"); } finally { setBusy(null); }
  }

  const Actions = ({ c }: { c: Row }) => (
    <div className="flex gap-1.5 flex-wrap">
      {c.status === "pending" && <Button size="sm" variant="primary" loading={busy === c.id} onClick={() => act(c, "approve")}>אישור</Button>}
      {c.status === "approved" && <Button size="sm" loading={busy === c.id} onClick={() => act(c, "send")}>נשלח</Button>}
      {(c.status === "approved" || c.status === "sent") && <Button size="sm" loading={busy === c.id} onClick={() => act(c, "redeem")}>מומש</Button>}
      {(c.status === "pending" || c.status === "approved") && <Button size="sm" variant="danger" loading={busy === c.id} onClick={() => act(c, "reject")}>ביטול</Button>}
    </div>
  );
  const who = (c: Row) => c.customers?.full_name || c.reviews?.contact_name || "לקוח אנונימי";
  const phone = (c: Row) => c.customers?.phone || c.reviews?.contact_phone || null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">הטבות</h1>
        <select className="input w-auto min-h-[40px] py-1.5" value={filter} onChange={(e) => setFilter(e.target.value as CouponStatus | "")} aria-label="סינון לפי סטטוס">
          <option value="">כל הסטטוסים</option>
          {(Object.keys(COUPON_STATUS) as CouponStatus[]).map((k) => <option key={k} value={k}>{COUPON_STATUS[k].label}</option>)}
        </select>
      </div>

      {!rows ? <PageState kind="loading" /> : rows.length === 0 ? <PageState kind="empty" title="אין הטבות עדיין" text="הטבה נוצרת אוטומטית לכל משוב." /> : (
        <>
          <ul className="md:hidden flex flex-col gap-2">
            {rows.map((c) => (
              <li key={c.id} className="card p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <bdi dir="ltr" className="font-mono font-medium">{c.code}</bdi>
                  <Badge tone={COUPON_STATUS[c.status].tone}>{COUPON_STATUS[c.status].label}</Badge>
                </div>
                <div className="text-sm text-slate-700">{fmtDiscount(c.discount_type, c.discount_value)}</div>
                <div className="text-xs text-slate-500">{who(c)} {phone(c) && <bdi dir="ltr">· {phone(c)}</bdi>} · {c.reviews?.rating ?? "—"}★ · עד {fmtDate(c.expiration_date)}</div>
                <Actions c={c} />
              </li>
            ))}
          </ul>
          <div className="hidden md:block card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-3 text-right font-medium">קוד</th><th className="p-3 text-right font-medium">לקוח</th>
                  <th className="p-3 text-right font-medium">דירוג</th><th className="p-3 text-right font-medium">הטבה</th>
                  <th className="p-3 text-right font-medium">סטטוס</th><th className="p-3 text-right font-medium">תוקף</th><th className="p-3 text-right font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="p-3 font-mono"><bdi dir="ltr">{c.code}</bdi></td>
                    <td className="p-3">{who(c)}{phone(c) && <div className="text-xs text-slate-500"><bdi dir="ltr">{phone(c)}</bdi></div>}</td>
                    <td className="p-3">{c.reviews?.rating ?? "—"}★</td>
                    <td className="p-3">{fmtDiscount(c.discount_type, c.discount_value)}</td>
                    <td className="p-3"><Badge tone={COUPON_STATUS[c.status].tone}>{COUPON_STATUS[c.status].label}</Badge></td>
                    <td className="p-3 text-slate-500">{fmtDate(c.expiration_date)}</td>
                    <td className="p-3"><Actions c={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
