// Input validation + normalization shared by the public endpoints and unit tests.

export const LIMITS = {
  text: 2000,
  name: 100,
  message: 2000,
  bestTime: 100,
} as const;

export function isValidRating(r: unknown): r is 1 | 2 | 3 | 4 | 5 {
  return typeof r === "number" && Number.isInteger(r) && r >= 1 && r <= 5;
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export function clampText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

/** Mirrors the SQL normalize_phone(): E.164, Israeli default. Returns null when not a phone. */
export function normalizePhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const raw = v.trim();
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 7) return null;
  if (raw.replace(/[^0-9+]/g, "").startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+972${digits.slice(1)}`;
  return `+${digits}`;
}

export function normalizeEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  if (!e) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : null;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9֐-׿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Only https URLs with a hostname (no raw IPs) — enough SSRF hygiene for an MVP. */
export function isSafeWebhookUrl(v: unknown): v is string {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return false;
    if (/^[0-9.]+$/.test(u.hostname) || u.hostname.includes(":")) return false;
    if (["localhost"].includes(u.hostname) || u.hostname.endsWith(".local")) return false;
    return true;
  } catch { return false; }
}
