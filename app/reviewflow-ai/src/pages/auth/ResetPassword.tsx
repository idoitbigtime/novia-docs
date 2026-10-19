import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { authErrorToHebrew } from "@/lib/errors";

// Landing page for the recovery link. Supabase puts the session in the URL hash;
// the client picks it up automatically, then we let the user set a new password.
export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(authErrorToHebrew(error.message)); return; }
    navigate("/app");
  }

  return (
    <div dir="rtl" className="min-h-dvh flex items-center justify-center px-4 bg-slate-50">
      <form onSubmit={onSubmit} className="card p-8 w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-xl font-bold text-center">בחירת סיסמה חדשה</h1>
        {!ready && <p className="text-sm text-slate-500 text-center">מאמת את הקישור…</p>}
        <div>
          <label className="label" htmlFor="npw">סיסמה חדשה</label>
          <input id="npw" className="input" dir="ltr" type="password" minLength={6} required autoComplete="new-password"
            value={pw} onChange={(e) => setPw(e.target.value)} disabled={!ready} />
        </div>
        {err && <p role="alert" className="text-red-600 text-sm">{err}</p>}
        <button className="btn-primary" disabled={!ready || busy}>{busy ? "שומר…" : "שמירה וכניסה"}</button>
      </form>
    </div>
  );
}
