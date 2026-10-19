import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageSquare, AlertTriangle, Ticket, Share2, QrCode, Settings, Shield, Plus, LogOut, Menu, X, Store, Megaphone, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useActiveBusiness } from "@/lib/businessContext";

const NAV = [
  { to: "/app",           label: "סקירה",    icon: LayoutDashboard, end: true },
  { to: "/app/reviews",   label: "ביקורות",  icon: MessageSquare },
  { to: "/app/negative",  label: "לטיפול",   icon: AlertTriangle, badge: "negative" as const },
  { to: "/app/coupons",   label: "הטבות",    icon: Ticket, badge: "coupons" as const },
  { to: "/app/platforms", label: "פלטפורמות", icon: Share2 },
  { to: "/app/qr",        label: "QR",       icon: QrCode },
  { to: "/app/campaigns", label: "קמפיינים", icon: Megaphone },
  { to: "/app/profile",   label: "פרופיל העסק", icon: Store },
  { to: "/app/team",      label: "צוות",     icon: Users },
  { to: "/app/settings",  label: "הגדרות",   icon: Settings },
];
const MOBILE_TABS = ["/app", "/app/reviews", "/app/negative", "/app/coupons"];

export default function DashboardLayout() {
  const { business, businesses, select } = useActiveBusiness();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [badges, setBadges] = useState<{ negative: number; coupons: number }>({ negative: 0, coupons: 0 });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setEmail(session.user.email ?? "");
      const { data } = await supabase.from("profiles").select("is_platform_admin").eq("id", session.user.id).maybeSingle();
      setIsAdmin(!!data?.is_platform_admin);
    })();
  }, []);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const [{ count: negative }, { count: coupons }] = await Promise.all([
        supabase.from("reviews").select("id", { count: "exact", head: true }).eq("business_id", business.id)
          .in("ai_route", ["recovery_flow", "manual_review"]).in("status", ["new", "in_progress", "contacted"]),
        supabase.from("coupons").select("id", { count: "exact", head: true }).eq("business_id", business.id).eq("status", "pending"),
      ]);
      setBadges({ negative: negative ?? 0, coupons: coupons ?? 0 });
    })();
  }, [business?.id, location.pathname]);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  async function signOut() { await supabase.auth.signOut(); navigate("/login"); }

  const Nav = ({ compact = false }: { compact?: boolean }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const count = n.badge ? badges[n.badge] : 0;
        return (
          <NavLink key={n.to} to={n.to} end={n.end}
            className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${isActive ? "bg-brand text-white" : "hover:bg-slate-100 text-slate-700"}`}>
            <n.icon size={18} aria-hidden="true" />
            <span className="flex-1">{n.label}</span>
            {count > 0 && <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] grid place-items-center">{count}</span>}
          </NavLink>
        );
      })}
      {isAdmin && (
        <NavLink to="/app/admin" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition mt-1 ${isActive ? "bg-slate-900 text-white" : "hover:bg-slate-100 text-slate-700"}`}>
          <Shield size={18} aria-hidden="true" /><span>ניהול פלטפורמה</span>
        </NavLink>
      )}
      {!compact && <div className="h-px bg-slate-100 my-2" />}
    </nav>
  );

  const Switcher = () => (
    <div className="px-1">
      {businesses.length > 0 ? (
        <select className="input text-sm py-2 min-h-[40px]" value={business?.id ?? ""} onChange={(e) => select(e.target.value)} aria-label="בחירת עסק">
          {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          {business && !businesses.some((b) => b.id === business.id) && <option value={business.id}>{business.name} (מנהל)</option>}
        </select>
      ) : <div className="text-xs text-slate-400 px-2">אין עסק עדיין</div>}
      <Link to="/app/new" className="flex items-center gap-1 text-xs text-brand px-2 mt-2"><Plus size={14} aria-hidden="true" /> עסק חדש</Link>
    </div>
  );

  return (
    <div dir="rtl" className="min-h-dvh bg-slate-50 md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-white border-l border-slate-200 p-4 flex-col gap-3 sticky top-0 h-dvh">
        <div className="font-bold text-lg px-2 pt-1">ReviewFlow AI</div>
        <Switcher />
        <Nav />
        <div className="flex-1" />
        <div className="text-xs text-slate-500 px-2 truncate" title={email}>{email}</div>
        <button onClick={signOut} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 px-2 py-2"><LogOut size={16} aria-hidden="true" /> התנתקות</button>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-white border-b border-slate-200 px-3 h-14 flex items-center justify-between">
        <button className="p-2 -mr-2 rounded-lg hover:bg-slate-100" aria-label="תפריט" aria-expanded={open} onClick={() => setOpen(true)}><Menu size={22} /></button>
        <div className="font-bold truncate px-2">{business?.name ?? "ReviewFlow AI"}</div>
        <Link to="/app/new" className="p-2 -ml-2 rounded-lg hover:bg-slate-100" aria-label="עסק חדש"><Plus size={20} /></Link>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="תפריט ניווט" className="absolute inset-y-0 right-0 w-72 max-w-[85vw] bg-white p-4 flex flex-col gap-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="font-bold text-lg">ReviewFlow AI</div>
              <button className="p-2 rounded-lg hover:bg-slate-100" aria-label="סגירה" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <Switcher />
            <Nav compact />
            <div className="flex-1" />
            <div className="text-xs text-slate-500 truncate">{email}</div>
            <button onClick={signOut} className="flex items-center gap-2 text-sm text-slate-500 py-2"><LogOut size={16} aria-hidden="true" /> התנתקות</button>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 grid grid-cols-4 pb-[env(safe-area-inset-bottom)]" aria-label="ניווט מהיר">
        {NAV.filter((n) => MOBILE_TABS.includes(n.to)).map((n) => {
          const count = n.badge ? badges[n.badge] : 0;
          return (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `relative flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] min-h-[56px] ${isActive ? "text-brand" : "text-slate-500"}`}>
              <n.icon size={20} aria-hidden="true" />
              <span>{n.label}</span>
              {count > 0 && <span className="absolute top-1.5 right-1/2 -mr-5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] grid place-items-center">{count}</span>}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
