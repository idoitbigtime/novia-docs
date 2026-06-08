import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const fn = mode === "signin" ? supabase.auth.signInWithPassword : supabase.auth.signUp;
      const { error } = await fn.call(supabase.auth, { email, password });
      if (error) throw error;
      navigate("/app");
    } catch (e: any) {
      setErr(e.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <form onSubmit={onSubmit} className="card p-8 w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">ReviewFlow AI</h1>
        <p className="text-center text-slate-500 text-sm">
          {mode === "signin" ? "כניסה לחשבון" : "יצירת חשבון חדש"}
        </p>
        <div>
          <label className="label">אימייל</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">סיסמה</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="btn-primary" disabled={busy}>
          {busy ? "..." : mode === "signin" ? "כניסה" : "הרשמה"}
        </button>
        <button
          type="button"
          className="text-sm text-brand"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin" ? "אין לי חשבון — הרשמה" : "יש לי חשבון — כניסה"}
        </button>
      </form>
    </div>
  );
}
