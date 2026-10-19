// Supabase Auth "Send Email" hook → GoHighLevel.
//
// STATUS: BUILT, NOT WIRED. Until GHL is connected, leave the hook DISABLED in
// Supabase (Auth → Hooks) and keep "Confirm email" OFF so sign-up is instant.
// When ready: set SUPABASE_AUTH_HOOK_SECRET, GHL_PLATFORM_* env vars, enable the
// hook pointing at /.netlify/functions/auth-email-hook, then turn confirm-email on.
//
// Payload (Supabase): { user: {id,email,user_metadata}, email_data: { token_hash, redirect_to,
//   email_action_type: 'signup'|'recovery'|'magiclink'|'email_change'|'invite', ... } }
import type { Handler } from "@netlify/functions";
import { createHmac, timingSafeEqual } from "node:crypto";
import { getServiceSupabase } from "./_shared/supabase";
import { json } from "./_shared/http";

const SUBJECTS: Record<string, string> = {
  signup: "אימות כתובת המייל — ReviewFlow AI",
  recovery: "איפוס סיסמה — ReviewFlow AI",
  magiclink: "קישור כניסה — ReviewFlow AI",
  email_change: "אישור שינוי מייל — ReviewFlow AI",
  invite: "הוזמנת ל-ReviewFlow AI",
};

/** Standard Webhooks signature: "v1,<base64 hmac>" over "<id>.<timestamp>.<body>". */
function verify(headers: Record<string, string | undefined>, body: string, secret: string): boolean {
  const id = headers["webhook-id"], ts = headers["webhook-timestamp"], sig = headers["webhook-signature"];
  if (!id || !ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false; // 5 min tolerance
  const raw = secret.startsWith("v1,whsec_") ? Buffer.from(secret.slice(9), "base64") : Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", raw).update(`${id}.${ts}.${body}`).digest("base64");
  return sig.split(" ").some((s) => {
    const v = s.split(",")[1] ?? "";
    try { return v.length === expected.length && timingSafeEqual(Buffer.from(v), Buffer.from(expected)); } catch { return false; }
  });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "METHOD_NOT_ALLOWED" });
  const secret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  const webhook = process.env.GHL_AUTH_EMAIL_WEBHOOK_URL;
  if (!secret || !webhook) return json(503, { error: "NOT_CONFIGURED" });

  const body = event.body ?? "";
  if (!verify(event.headers as Record<string, string | undefined>, body, secret)) return json(401, { error: "UNAUTHORIZED" });

  const payload = JSON.parse(body) as any;
  const email: string | undefined = payload?.user?.email;
  const d = payload?.email_data ?? {};
  if (!email || !d.token_hash || !d.email_action_type) return json(400, { error: "INVALID_INPUT" });

  const type = String(d.email_action_type);
  const verifyUrl = `${process.env.SUPABASE_URL}/auth/v1/verify?token=${encodeURIComponent(d.token_hash)}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(d.redirect_to || process.env.APP_PUBLIC_URL || "")}`;

  const ghlPayload = {
    event: "auth_email",
    email_type: type,
    subject: SUBJECTS[type] ?? "ReviewFlow AI",
    to_email: email,
    full_name: payload?.user?.user_metadata?.full_name ?? "",
    action_link: verifyUrl,
    token: d.token ?? null,          // 6-digit OTP when enabled
    app_url: process.env.APP_PUBLIC_URL ?? "",
  };

  const res = await fetch(webhook, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ghlPayload), signal: AbortSignal.timeout(5000),
  }).catch((e) => ({ ok: false, status: 0, statusText: String(e) } as Response));

  // Audit without storing the token/link.
  try {
    const sb = getServiceSupabase();
    const { data: biz } = await sb.from("businesses").select("id").limit(1).maybeSingle();
    if (biz) await sb.from("ghl_event_log").insert({
      business_id: biz.id, event: "auth_email", payload: { email_type: type, to: email }, status_code: res.status || null,
      error: res.ok ? null : `auth email webhook ${res.status}`,
    });
  } catch { /* logging must never fail the hook */ }

  if (!res.ok) return json(502, { error: "DELIVERY_FAILED" });
  return json(200, {});
};
