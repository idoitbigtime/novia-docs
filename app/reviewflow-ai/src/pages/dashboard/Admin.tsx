import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { setActiveBusinessId } from "@/lib/businessContext";
import { Badge, Button, PageState } from "@/components/ui";
import { fmtDate, fmtNumber } from "@/lib/format";

interface Row { id: string; name: string; slug: string; created_at: string; is_demo: boolean; is_active: boolean; reviews: number; open: number }

export default function Admin() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [totals, setTotals] = useState({ reviews: 0, coupons: 0, outboxFailed: 0 });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase.from("profiles").select("is_platform_admin").eq("id", session.user.id).maybeSingle();
      const admin = !!prof?.is_platform_admin; setIsAdmin(admin); if (!admin) return;

      const [{ data: biz }, { data: revs }, { count: coupons }, { count: failed }] = await Promise.all([
        supabase.from("businesses").select("id, name, slug, created_at, is_demo, is_active").order("created_at", { ascending: false }),
        supabase.from("reviews").select("business_id, ai_route, status"),
        supabase.from("coupons").select("id", { count: "exact", head: true }),
        supabase.from("outbox").select("id", { count: "exact", head: true }).eq("status", "failed"),
      ]);
      const count = new Map<string, number>(), open = new Map<string, number>();
      (revs ?? []).forEach((r: any) => {
        count.set(r.business_id, (count.get(r.business_id) ?? 0) + 1);
        if (r.ai_route !== "positive_flow" && ["new", "in_progress", "contacted"].includes(r.status)) open.set(r.business_id, (open.get(r.business_id) ?? 0) + 1);
      });
      setRows((biz ?? []).map((b: any) => ({ ...b, reviews: count.get(b.id) ?? 0, open: open.get(b.id) ?? 0 })));
      setTotals({ reviews: revs?.length ?? 0, coupons: coupons ?? 0, outboxFailed: failed ?? 0 });
    })();
  }, []);

  function enter(id: string) { setActiveBusinessId(id); navigate("/app"); }
  async function toggleActive(b: Row) {
    await supabase.from("businesses").update({ is_active: !b.is_active }).eq("id", b.id);
    setRows((rs) => rs?.map((x) => (x.id === b.id ? { ...x, is_active: !b.is_active } : x)) ?? null);
  }

  if (isAdmin === false) return <PageState kind="error" title="דף זה זמין למנהלי פלטפורמה בלבד" />;
  if (!rows) return <PageState kind="loading" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">ניהול פלטפורמה</h1>
        <Link to="/app/new" className="btn-primary btn-sm">+ עסק חדש</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><div className="text-xs text-slate-500">עסקים</div><div className="text-2xl font-bold">{fmtNumber(rows.length)}</div></div>
        <div className="stat-card"><div className="text-xs text-slate-500">ביקורות</div><div className="text-2xl font-bold">{fmtNumber(totals.reviews)}</div></div>
        <div className="stat-card"><div className="text-xs text-slate-500">הטבות</div><div className="text-2xl font-bold">{fmtNumber(totals.coupons)}</div></div>
        <div className="stat-card"><div className="text-xs text-slate-500">אירועי GHL שנכשלו</div><div className={`text-2xl font-bold ${totals.outboxFailed ? "text-red-600" : ""}`}>{fmtNumber(totals.outboxFailed)}</div></div>
      </div>

      <ul className="md:hidden flex flex-col gap-2">
        {rows.map((b) => (
          <li key={b.id} className="card p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium flex items-center gap-2">{b.name}{b.is_demo && <Badge>דמו</Badge>}{!b.is_active && <Badge tone="warning">מושבת</Badge>}</div>
              <div className="text-xs text-slate-500" dir="ltr">/r/{b.slug}</div>
              <div className="text-xs text-slate-500">{b.reviews} ביקורות · {b.open} פתוחות</div>
            </div>
            <Button size="sm" onClick={() => enter(b.id)}>כניסה <ChevronLeft size={14} /></Button>
          </li>
        ))}
      </ul>
      <div className="hidden md:block card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-3 text-right font-medium">עסק</th><th className="p-3 text-right font-medium">כתובת</th><th className="p-3 text-right font-medium">ביקורות</th><th className="p-3 text-right font-medium">פתוחות</th><th className="p-3 text-right font-medium">נוצר</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="p-3 font-medium"><span className="flex items-center gap-2">{b.name}{b.is_demo && <Badge>דמו</Badge>}{!b.is_active && <Badge tone="warning">מושבת</Badge>}</span></td>
                <td className="p-3 text-slate-500" dir="ltr">/r/{b.slug}</td>
                <td className="p-3">{b.reviews}</td>
                <td className="p-3">{b.open > 0 ? <Badge tone="danger">{b.open}</Badge> : "0"}</td>
                <td className="p-3 text-slate-500">{fmtDate(b.created_at)}</td>
                <td className="p-3"><div className="flex gap-2 justify-end"><Button size="sm" onClick={() => toggleActive(b)}>{b.is_active ? "השבתה" : "הפעלה"}</Button><Button size="sm" variant="primary" onClick={() => enter(b.id)}>כניסה <ChevronLeft size={14} /></Button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
