import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
  const { business } = useActiveBusiness();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div dir="rtl" className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-white border-l border-slate-200 p-4 flex flex-col gap-1">
        <div className="px-3 py-3 mb-2">
          <div className="font-bold text-lg">ReviewFlow AI</div>
          <div className="text-xs text-slate-500 truncate">{business?.name ?? "—"}</div>
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
