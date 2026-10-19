const he = "he-IL";

export function fmtDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v.length === 10 ? `${v}T00:00:00` : v) : v;
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(he, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function fmtDateTime(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString(he, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtCurrency(v: number | string | null | undefined): string {
  const n = typeof v === "string" ? Number(v) : v;
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(he, { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n);
}

export function fmtNumber(v: number | null | undefined): string {
  return v == null ? "—" : new Intl.NumberFormat(he).format(v);
}

export function fmtRating(v: number | null | undefined): string {
  return v == null || Number.isNaN(v) ? "—" : `${v}/5`;
}

export function fmtDiscount(type: "percent" | "fixed" | "custom_text", value: string): string {
  if (type === "percent") return `${value}% הנחה`;
  if (type === "fixed") return `${fmtCurrency(value)} הנחה`;
  return value;
}
