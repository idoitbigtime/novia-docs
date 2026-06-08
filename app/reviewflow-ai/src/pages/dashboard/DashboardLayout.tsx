import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/businessContext";

const navItems = [
  { to: "/app",           label: "סקירה",          end: true },
  { to: "/app/reviews",   label: "ביקורות" },
  { to: "/app/negative",  label: "ביקורות שליליות" },
  { to: "/app/coupons",   label: "קופונים" },
  { to: "/app/platforms", label: "פלטפורמות" },
  { to: "/app/qr",        label: "QR" },
  { to: "/app/settings",  label: "הגדרות" },
];

export default function DashboardLayout() {
  const { business, businesses, select } = useActiveBusiness();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("profiles").select("is_platform_admin").eq("id", session.user.id).maybeSingle();
      setIsAdmin(!!data?.is_platform_admin);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-white border-l border-slate-200 p-4 flex flex-col gap-1">
        <div className="px-1 py-2 mb-2">
          <div className="font-bold text-lg px-2">ReviewFlow AI</div>
          {/* Business switcher */}
          {businesses.length > 0 ? (
            <select
              className="input mt-2 text-sm py-1.5"
              value={business?.id ?? ""}
              onChange={(e) => select(e.target.value)}
            >
              {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              {business && !businesses.some((b) => b.id === business.id) && (
                <option value={business.id}>{business.name} (admin)</option>
              )}
            </select>
          ) : (
            <div className="text-xs text-slate-400 px-2 mt-1">אין עסק עדיין</div>
          )}
          <Link to="/app/new" className="block text-xs text-brand px-2 mt-1.5">+ עסק חדש</Link>
        </div>

        {navItems.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `px-3 py-2 rounded-xl text-sm transition ${
                isActive ? "bg-brand text-white" : "hover:bg-slate-100 text-slate-700"
              }`
            }
          >
            {n.label}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to="/app/admin"
            className={({ isActive }) =>
              `px-3 py-2 rounded-xl text-sm transition mt-1 ${
                isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"
              }`
            }
          >
            🛡️ ניהול פלטפורמה
          </NavLink>
        )}

        <div className="flex-1" />
        <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-900 px-3 py-2 text-right">
          התנתקות
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
