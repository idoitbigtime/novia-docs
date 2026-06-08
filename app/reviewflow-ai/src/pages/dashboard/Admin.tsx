import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { setActiveBusinessId } from "@/lib/businessContext";

interface Row {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  reviews: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: prof } = await supabase.from("profiles").select("is_platform_admin").eq("id", session.user.id).maybeSingle();
      const admin = !!prof?.is_platform_admin;
      setIsAdmin(admin);
      if (!admin) return;

      const { data: biz } = await supabase
        .from("businesses").select("id, name, slug, created_at").order("created_at", { ascending: false });
      const { data: revs } = await supabase.from("reviews").select("business_id");
      const counts = new Map<string, number>();
      (revs ?? []).forEach((r: any) => counts.set(r.business_id, (counts.get(r.business_id) ?? 0) + 1));
      setRows((biz ?? []).map((b: any) => ({ ...b, reviews: counts.get(b.id) ?? 0 })));
    })();
  }, []);

  function enter(id: string) {
    setActiveBusinessId(id);
    navigate("/app");
  }

  if (isAdmin === false) return <p className="text-slate-500">דף זה זמין למנהלי פלטפורמה בלבד.</p>;
  if (!rows) return <p className="text-slate-500">טוען…</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ניהול פלטפורמה</h1>
        <Link to="/app/new" className="btn-primary">+ עסק חדש</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="stat-card"><div className="text-xs text-slate-500">סה״כ עסקים</div><div className="text-2xl font-bold">{rows.length}</div></div>
        <div className="stat-card"><div className="text-xs text-slate-500">סה״כ ביקורות</div><div className="text-2xl font-bold">{rows.reduce((s, r) => s + r.reviews, 0)}</div></div>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="p-3 text-right">עסק</th>
              <th className="p-3 text-right">slug</th>
              <th className="p-3 text-right">ביקורות</th>
              <th className="p-3 text-right">נוצר</th>
              <th className="p-3 text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="p-3 font-medium">{b.name}</td>
                <td className="p-3 text-slate-500" dir="ltr">/r/{b.slug}</td>
                <td className="p-3">{b.reviews}</td>
                <td className="p-3 text-slate-500">{new Date(b.created_at).toLocaleDateString("he-IL")}</td>
                <td className="p-3 text-left"><button className="btn-ghost" onClick={() => enter(b.id)}>כניסה →</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
