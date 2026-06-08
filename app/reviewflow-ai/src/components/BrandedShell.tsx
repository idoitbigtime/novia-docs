import { PropsWithChildren } from "react";
import type { BusinessBrand } from "@/lib/types";

interface Props {
  business: BusinessBrand | null;
}

export default function BrandedShell({ business, children }: PropsWithChildren<Props>) {
  const color = business?.brand_color || "#6d28d9";
  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-6"
      style={{ ["--brand-color" as any]: color }}
    >
      <header className="w-full max-w-md flex flex-col items-center text-center mb-6 mt-2">
        {business?.logo_url ? (
          <img src={business.logo_url} alt={business.name} className="h-16 w-16 rounded-2xl object-cover shadow" />
        ) : (
          <div className="h-16 w-16 rounded-2xl shadow flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: color }}>
            {business?.name?.[0] ?? "★"}
          </div>
        )}
        <h1 className="mt-3 text-2xl font-bold">{business?.name ?? "ReviewFlow AI"}</h1>
      </header>
      <main className="w-full max-w-md">{children}</main>
      <footer className="mt-auto pt-8 pb-2 text-xs text-slate-400">
        powered by <span className="font-semibold">ReviewFlow AI</span>
      </footer>
    </div>
  );
}
