// Minimal UI kit: Badge, Button, Skeleton, PageState, ConfirmDialog, Toast (provider + hook).
import { createContext, PropsWithChildren, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { TONE_CLASS, type Tone } from "@/lib/labels";

// ---------------------------------------------------------------- Badge
export function Badge({ tone = "neutral", children, className = "" }: PropsWithChildren<{ tone?: Tone; className?: string }>) {
  return <span className={`badge ${TONE_CLASS[tone]} ${className}`}>{children}</span>;
}

// ---------------------------------------------------------------- Button
type Variant = "primary" | "ghost" | "danger";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; size?: "sm" | "md"; loading?: boolean }
export function Button({ variant = "ghost", size = "md", loading, children, className = "", disabled, ...rest }: ButtonProps) {
  const base = variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : "btn-ghost";
  return (
    <button className={`${base} ${size === "sm" ? "btn-sm" : ""} ${className}`} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- Skeleton / PageState
export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`rounded-lg bg-slate-100 animate-pulse ${className}`} aria-hidden="true" />;
}

export function PageState({ kind, title, text, action }: { kind: "loading" | "empty" | "error"; title?: string; text?: string; action?: ReactNode }) {
  if (kind === "loading") {
    return <div className="flex flex-col gap-3" aria-busy="true"><Skeleton className="h-8 w-48" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>;
  }
  return (
    <div className="card p-8 text-center text-slate-500 flex flex-col items-center gap-2">
      <div className="text-3xl" aria-hidden="true">{kind === "empty" ? "🗂️" : "⚠️"}</div>
      <p className="font-medium text-slate-700">{title ?? (kind === "empty" ? "אין נתונים עדיין" : "משהו השתבש")}</p>
      {text && <p className="text-sm">{text}</p>}
      {action}
    </div>
  );
}

// ---------------------------------------------------------------- ConfirmDialog
interface ConfirmOpts { title: string; text?: string; confirmLabel?: string; danger?: boolean }
type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>;
const ConfirmCtx = createContext<ConfirmFn>(() => Promise.resolve(false));
export const useConfirm = () => useContext(ConfirmCtx);

// ---------------------------------------------------------------- Toast
interface ToastItem { id: number; kind: "ok" | "err" | "info"; text: string }
type ToastFn = (text: string, kind?: ToastItem["kind"]) => void;
const ToastCtx = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastCtx);

export function UiProvider({ children }: PropsWithChildren) {
  // toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const toast = useCallback<ToastFn>((text, kind = "ok") => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  // confirm
  const [dlg, setDlg] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const confirm = useCallback<ConfirmFn>((opts) => new Promise((resolve) => setDlg({ ...opts, resolve })), []);
  const close = (v: boolean) => { dlg?.resolve(v); setDlg(null); };
  useEffect(() => {
    if (!dlg) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dlg]);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <ToastCtx.Provider value={value.toast}>
      <ConfirmCtx.Provider value={value.confirm}>
        {children}
        {/* toasts */}
        <div className="fixed bottom-4 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} role="status"
              className={`pointer-events-auto rounded-xl px-4 py-2.5 text-sm shadow-lg ${t.kind === "ok" ? "bg-emerald-600 text-white" : t.kind === "err" ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`}>
              {t.text}
            </div>
          ))}
        </div>
        {/* confirm */}
        {dlg && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => close(false)}>
            <div role="dialog" aria-modal="true" aria-labelledby="cf-title" className="card p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 id="cf-title" className="font-bold text-lg">{dlg.title}</h3>
              {dlg.text && <p className="text-sm text-slate-600 mt-1">{dlg.text}</p>}
              <div className="flex gap-2 mt-4 justify-start">
                <Button variant={dlg.danger ? "danger" : "primary"} onClick={() => close(true)} autoFocus>{dlg.confirmLabel ?? "אישור"}</Button>
                <Button onClick={() => close(false)}>ביטול</Button>
              </div>
            </div>
          </div>
        )}
      </ConfirmCtx.Provider>
    </ToastCtx.Provider>
  );
}
