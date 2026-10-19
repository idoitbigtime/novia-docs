import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { setActiveBusinessId } from "@/lib/businessContext";
import { apiError } from "@/lib/errors";

// /invite/:token — if signed in, accept; otherwise send to login and come back.
export default function AcceptInvite() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "need_login" | "error" | "done">("checking");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { sessionStorage.setItem("rf:pendingInvite", token); setState("need_login"); return; }
      const res = await fetch("/api/accept-invite", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ token }) });
      if (!res.ok) { setMsg(await apiError(res)); setState("error"); return; }
      const j = await res.json(); setActiveBusinessId(j.business_id); setState("done");
      setTimeout(() => navigate("/app"), 800);
    })();
  }, [token]);

  return (
    <div dir="rtl" className="min-h-dvh flex items-center justify-center p-4 bg-slate-50">
      <div className="card p-8 max-w-sm w-full text-center flex flex-col gap-3">
        <h1 className="text-xl font-bold">הזמנה לצוות</h1>
        {state === "checking" && <p className="text-slate-500">בודקים את ההזמנה…</p>}
        {state === "need_login" && <><p className="text-slate-600 text-sm">כדי לקבל את ההזמנה צריך להתחבר (או להירשם) עם האימייל שאליו נשלחה.</p><Link to="/login" className="btn-primary">כניסה / הרשמה</Link></>}
        {state === "error" && <><p className="text-red-600 text-sm">{msg}</p><Link to="/app" className="btn-ghost">לדשבורד</Link></>}
        {state === "done" && <p className="text-emerald-700">הצטרפת לצוות! מעבירים אותך…</p>}
      </div>
    </div>
  );
}
