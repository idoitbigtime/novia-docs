import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/businessContext";

interface Stats {
  total: number; avg: number; positive: number; negative: number;
  google_clicks: number; coupons_issued: number; coupons_pending: number; open_recovery: number;
}

export default function Overview() {
  const { business } = useActiveBusiness();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating, ai_sentiment, ai_route, status, platform_clicked")
        .eq("business_id", business.id);
      const { data: coupons } = await supabase
        .from("coupons")
        .select("status")
        .eq("business_id", business.id);

      const r = reviews ?? [];
      const c = coupons ?? [];
      setStats({
        total: r.length,
        avg: r.length ? Math.round((r.reduce((s, x) => s + (x.rating || 0), 0) / r.length) * 10) / 10 : 0,
        positive: r.filter((x) => x.ai_sentiment === "positive").length,
        negative: r.filter((x) => x.ai_sentiment === "negative").length,
        google_clicks: r.filter((x) => x.platform_clicked === "google").length,
        coupons_issued: c.length,
        coupons_pending: c.filter((x) => x.status === "pending").length,
        open_recovery: r.filter((x) => x.ai_route === "recovery_flow" && x.status !== "resolved").length,
      });
    })();
  }, [business?.id]);

  if (!business) return (
    <div className="card p-8 text-center max-w-md mx-auto mt-10">
      <div className="text-3xl mb-3">🏪</div>
      <h2 className="text-xl font-bold mb-2">ברוך הבא ל-ReviewFlow AI</h2>
      <p className="text-slate-500 mb-5">עדיין אין לך עסק במערכת. בוא נקים את הראשון.</p>
      <a href="/app/new" className="btn-primary inline-block">+ יצירת עסק חדש</a>
    </div>
  );
  if (!stats) return <p className="text-slate-500">טוען…</p>;

  const cards: Array<[string, string | number]> = [
    ["סה״כ ביקורות", stats.total],
    ["דירוג ממוצע", stats.avg],
    ["חיוביות", stats.positive],
    ["שליליות", stats.negative],
    ["קליקים ל-Google", stats.google_clicks],
    ["קופונים שהונפקו", stats.coupons_issued],
    ["ממתינים לאישור", stats.coupons_pending],
    ["טיפולי שירות פתוחים", stats.open_recovery],
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">סקירה</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(([k, v]) => (
          <div key={k} className="stat-card">
            <div className="text-xs text-slate-500">{k}</div>
            <div className="text-2xl font-bold">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
