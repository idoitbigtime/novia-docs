import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { supabase } from "@/lib/supabase";
import RequireBusiness from "@/components/RequireBusiness";
import { PageState } from "@/components/ui";
import { fmtNumber, fmtRating } from "@/lib/format";
import { PLATFORM_KIND } from "@/lib/labels";
import type { BusinessStats } from "@/lib/types";

const RANGES = [{ d: 7, l: "7 ימים" }, { d: 30, l: "30 יום" }, { d: 90, l: "90 יום" }];
const SENT_COLORS = { positive: "#10b981", neutral: "#94a3b8", negative: "#ef4444" };

export default function Overview() {
  return <RequireBusiness>{(b) => <OverviewInner businessId={b.id} slug={b.slug} />}</RequireBusiness>;
}

function OverviewInner({ businessId, slug }: { businessId: string; slug: string }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    setStats(null); setErr(false);
    const from = new Date(Date.now() - days * 86_400_000).toISOString();
    supabase.rpc("business_stats", { p_business_id: businessId, p_from: from, p_to: new Date().toISOString() })
      .then(({ data, error }) => { if (error || !data) setErr(true); else setStats(data as BusinessStats); });
  }, [businessId, days]);

  if (err) return <PageState kind="error" text="לא הצלחנו לטעון את הנתונים" />;
  if (!stats) return <PageState kind="loading" />;

  const cards: Array<[string, string, string?]> = [
    ["ביקורות", fmtNumber(stats.reviews)],
    ["דירוג ממוצע", fmtRating(stats.avg_rating)],
    ["חיוביות", fmtNumber(stats.positive)],
    ["לטיפול", fmtNumber(stats.negative + stats.manual), "/app/negative"],
    ["לחיצות שיתוף", fmtNumber(stats.clicks)],
    ["הטבות שהונפקו", fmtNumber(stats.coupons_issued)],
    ["הטבות ממתינות", fmtNumber(stats.coupons_pending), "/app/coupons"],
    ["מקרים פתוחים", fmtNumber(stats.open_recovery), "/app/negative"],
  ];
  const funnel = [
    { k: "ביקורים", v: stats.visits }, { k: "משובים", v: stats.reviews }, { k: "חיוביים", v: stats.positive },
    { k: "לחיצות", v: stats.clicks }, { k: "הטבות", v: stats.coupons_issued }, { k: "מומשו", v: stats.coupons_redeemed },
  ];
  const sentiment = (["positive", "neutral", "negative"] as const).map((k) => ({ name: { positive: "חיובי", neutral: "ניטרלי", negative: "שלילי" }[k], value: stats.sentiment[k], fill: SENT_COLORS[k] })).filter((x) => x.value > 0);
  const clicks = Object.entries(stats.clicks_by_platform).map(([k, v]) => ({ name: PLATFORM_KIND[k] ?? k, v }));
  const byDay = stats.by_day.map((d) => ({ ...d, label: new Date(d.day).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" }) }));
  const empty = stats.reviews === 0 && stats.visits === 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">סקירה</h1>
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
          {RANGES.map((r) => (
            <button key={r.d} onClick={() => setDays(r.d)} className={`px-3 py-1.5 rounded-lg text-sm ${days === r.d ? "bg-brand text-white" : "text-slate-600"}`}>{r.l}</button>
          ))}
        </div>
      </div>

      {empty && (
        <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="font-medium">עדיין אין משובים — בואו נתחיל</p>
            <p className="text-sm text-slate-500">הדפיסו את ה-QR, הוסיפו קישורי פלטפורמות, ושלחו משוב ראשון לבדיקה.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/app/qr" className="btn-ghost btn-sm">QR</Link>
            <Link to="/app/platforms" className="btn-ghost btn-sm">פלטפורמות</Link>
            <a href={`/r/${slug}`} target="_blank" rel="noopener" className="btn-primary btn-sm">דף הלקוח ↗</a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(([k, v, to]) => {
          const inner = <><div className="text-xs text-slate-500">{k}</div><div className="text-2xl font-bold">{v}</div></>;
          return to ? <Link key={k} to={to} className="stat-card hover:border-brand/50">{inner}</Link> : <div key={k} className="stat-card">{inner}</div>;
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="card p-4 lg:col-span-2">
          <h2 className="font-bold mb-2">משובים לאורך זמן</h2>
          <div className="h-56" dir="ltr">
            <ResponsiveContainer>
              <AreaChart data={byDay} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="positive" name="חיוביים" stackId="1" stroke="#10b981" fill="#10b98133" />
                <Area type="monotone" dataKey="negative" name="לטיפול" stackId="1" stroke="#ef4444" fill="#ef444433" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-bold mb-2">פיצול סנטימנט</h2>
          <div className="h-56" dir="ltr">
            {sentiment.length ? (
              <ResponsiveContainer>
                <PieChart><Pie data={sentiment} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {sentiment.map((s, i) => <Cell key={i} fill={s.fill} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-slate-400 text-center pt-20">אין נתונים</p>}
          </div>
        </section>

        <section className="card p-4 lg:col-span-2">
          <h2 className="font-bold mb-2">משפך המרה</h2>
          <ol className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {funnel.map((f, i) => {
              const prev = i === 0 ? f.v : funnel[i - 1].v;
              const pct = prev ? Math.round((f.v / prev) * 100) : null;
              return (
                <li key={f.k} className="rounded-xl bg-slate-50 p-3 text-center">
                  <div className="text-xs text-slate-500">{f.k}</div>
                  <div className="text-xl font-bold">{fmtNumber(f.v)}</div>
                  {i > 0 && <div className="text-[11px] text-slate-400">{pct == null ? "—" : `${pct}%`}</div>}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="card p-4">
          <h2 className="font-bold mb-2">לחיצות לפי פלטפורמה</h2>
          <div className="h-40" dir="ltr">
            {clicks.length ? (
              <ResponsiveContainer>
                <BarChart data={clicks} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip />
                  <Bar dataKey="v" name="לחיצות" fill="#6d28d9" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-slate-400 text-center pt-14">אין לחיצות עדיין</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
