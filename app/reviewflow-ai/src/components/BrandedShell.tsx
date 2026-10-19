import { PropsWithChildren, useEffect } from "react";
import type { BusinessBrand } from "@/lib/types";

interface Props { business: BusinessBrand | null }

/** Picks black/white text for a given hex background (WCAG-ish luminance). */
export function brandForeground(hex: string): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return L > 0.45 ? "#0f172a" : "#ffffff";
}

export default function BrandedShell({ business, children }: PropsWithChildren<Props>) {
  const color = business?.brand_color || "#6d28d9";
  const fg = brandForeground(color);

  useEffect(() => {
    const prev = document.title;
    if (business?.name) document.title = `${business.name} — המשוב שלכם`;
    const meta = document.querySelector('meta[name="theme-color"]');
    const prevTheme = meta?.getAttribute("content");
    meta?.setAttribute("content", color);
    return () => { document.title = prev; if (prevTheme) meta?.setAttribute("content", prevTheme); };
  }, [business?.name, color]);

  return (
    <div
      className="min-h-dvh flex flex-col items-center px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ ["--brand-color" as string]: color, ["--brand-fg" as string]: fg }}
    >
      <header className="w-full max-w-md flex flex-col items-center text-center mb-5 mt-1">
        {business?.logo_url ? (
          <img src={business.logo_url} alt="" width={64} height={64} className="h-16 w-16 rounded-2xl object-cover shadow bg-white"
               onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <div aria-hidden="true" className="h-16 w-16 rounded-2xl shadow flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: color, color: fg }}>
            {business?.name?.[0] ?? "★"}
          </div>
        )}
        <h1 className="mt-3 text-2xl font-bold">{business?.name ?? "ReviewFlow AI"}</h1>
      </header>
      <main className="w-full max-w-md">{children}</main>
      <footer className="mt-auto pt-8 text-xs text-slate-400">
        מופעל ע״י <span className="font-medium">ReviewFlow AI</span>
      </footer>
    </div>
  );
}
