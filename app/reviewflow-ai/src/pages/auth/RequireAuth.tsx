import { PropsWithChildren, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function RequireAuth({ children }: PropsWithChildren) {
  const [state, setState] = useState<"loading" | "in" | "out">("loading");

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setState(data.session ? "in" : "out");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, sess) => {
      setState(sess ? "in" : "out");
    });
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  if (state === "loading") return <div className="p-8 text-center text-slate-500">…</div>;
  if (state === "out") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
