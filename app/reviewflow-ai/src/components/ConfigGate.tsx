import { PropsWithChildren } from "react";
import { supabaseConfigured } from "@/lib/supabase";

export default function ConfigGate({ children }: PropsWithChildren) {
  if (supabaseConfigured) return <>{children}</>;
  return (
    <div dir="rtl" className="min-h-dvh flex items-center justify-center p-6 bg-slate-50">
      <div className="card p-6 max-w-md text-center">
        <h1 className="text-xl font-bold mb-2">חסרה קונפיגורציה</h1>
        <p className="text-slate-600 text-sm">
          יש להגדיר את משתני הסביבה <code dir="ltr">VITE_SUPABASE_URL</code> ו-<code dir="ltr">VITE_SUPABASE_ANON_KEY</code> ולבנות מחדש.
        </p>
      </div>
    </div>
  );
}
