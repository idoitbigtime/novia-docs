// Shared HTTP helpers for Netlify Functions.
// Errors are returned as machine codes; the client maps them to Hebrew (src/lib/errors.ts).

const allowedOrigin = () => process.env.APP_PUBLIC_URL || "*";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
    body: JSON.stringify(body),
  };
}

export type ErrorCode =
  | "METHOD_NOT_ALLOWED" | "INVALID_INPUT" | "UNAUTHORIZED" | "FORBIDDEN"
  | "BUSINESS_NOT_FOUND" | "REVIEW_NOT_FOUND" | "COUPON_NOT_FOUND"
  | "RATE_LIMITED" | "QUOTA_EXCEEDED" | "SLUG_TAKEN" | "NOT_CONFIGURED" | "INTERNAL";

export function fail(code: ErrorCode, status = 400, details?: Record<string, unknown>) {
  return json(status, { error: code, ...(details ? { details } : {}) });
}
export function ok(body: unknown) { return json(200, body); }

/** Handles CORS preflight; returns a response for OPTIONS, else null. */
export function preflight(event: { httpMethod: string }) {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: corsHeaders(), body: "" };
  return null;
}

/** Safe JSON parse: always returns an object (never null/array/primitive). */
export function parseBody<T extends object = Record<string, unknown>>(event: { body?: string | null }): T {
  try {
    const v = event.body ? JSON.parse(event.body) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? (v as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

/** Client IP: Netlify's trusted header first, then the generic one. */
export function clientIp(headers: Record<string, string | undefined>): string | null {
  const h = headers["x-nf-client-connection-ip"] || headers["x-forwarded-for"] || "";
  const first = h.split(",")[0]?.trim();
  if (!first) return null;
  // basic sanity so a garbage header never breaks an inet cast
  return /^[0-9a-fA-F:.]+$/.test(first) ? first : null;
}

export function bearer(headers: Record<string, string | undefined>): string | null {
  const a = headers["authorization"] || headers["Authorization"];
  return a?.startsWith("Bearer ") ? a.slice(7) : null;
}
