import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { authErrorToHebrew } from "@/lib/errors";

type Mode = "signin" | "signup" | "forgot";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    try {
      const pendingInvite = sessionStorage.getItem("rf:pendingInvite");
      const afterAuth = pendingInvite ? `/invite/${pendingInvite}` : "/app";
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(afterAuth);
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` },
        });
        if (error) throw error;
        if (data.session) {
          navigate(pendingInvite ? afterAuth : "/app/new");
        } else {
          // confirm-email is ON: no session until the link is clicked
          setInfo(`שלחנו מייל אימות ל-${email}. אחרי הלחיצה על הקישור אפשר להתחבר.`);
          setMode("signin");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setInfo("אם המייל קיים אצלנו, שלחנו אליו קישור לאיפוס סיסמה.");
        setMode("signin");
      }
    } catch (e: any) {
      setErr(authErrorToHebrew(e?.message));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "signin" ? "כניסה לחשבון" : mode === "signup" ? "יצירת חשבון חדש" : "איפוס סיסמה";

  return (
    <div dir="rtl" className="min-h-dvh flex items-center justify-center px-4 bg-slate-50">
      <form onSubmit={onSubmit} className="card p-8 w-full max-w-sm flex flex-col gap-4" noValidate>
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-brand text-white grid place-items-center text-2xl font-bold">★</div>
          <h1 className="text-2xl font-bold mt-3">ReviewFlow AI</h1>
          <p className="text-slate-500 text-sm">{title}</p>
        </div>

        {mode === "signup" && (
          <div>
            <label className="label" htmlFor="name">שם מלא</label>
            <input id="name" className="input" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">אימייל</label>
          <input id="email" className="input" dir="ltr" type="email" inputMode="email" autoComplete="email" required
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {mode !== "forgot" && (
          <div>
            <label className="label" htmlFor="pw">סיסמה</label>
            <div className="relative">
              <input id="pw" className="input pl-16" dir="ltr" type={showPw ? "text" : "password"} required minLength={6}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 px-2 py-1">
                {showPw ? "הסתר" : "הצג"}
              </button>
            </div>
            {mode === "signup" && <p className="text-xs text-slate-400 mt-1">לפחות 6 תווים</p>}
          </div>
        )}

        {err && <p role="alert" className="text-red-600 text-sm">{err}</p>}
        {info && <p role="status" className="text-emerald-700 bg-emerald-50 rounded-xl p-3 text-sm">{info}</p>}

        <button className="btn-primary py-3" disabled={busy}>
          {busy ? "רק רגע…" : mode === "signin" ? "כניסה" : mode === "signup" ? "הרשמה" : "שליחת קישור איפוס"}
        </button>

        <div className="flex flex-col gap-2 text-sm text-center">
          {mode === "signin" && (
            <>
              <button type="button" className="text-brand py-1" onClick={() => setMode("signup")}>אין לי חשבון — הרשמה</button>
              <button type="button" className="text-slate-500 py-1" onClick={() => setMode("forgot")}>שכחתי סיסמה</button>
            </>
          )}
          {mode !== "signin" && (
            <button type="button" className="text-brand py-1" onClick={() => setMode("signin")}>יש לי חשבון — כניסה</button>
          )}
        </div>
        <p className="text-[11px] text-slate-400 text-center">
          בהרשמה אתם מאשרים את <Link to="/privacy" className="underline">מדיניות הפרטיות</Link>.
        </p>
      </form>
    </div>
  );
}
