// GoHighLevel integration layer.
//
// STATUS: BUILT BUT DISCONNECTED. Every outbound call checks `isConfigured()`;
// until a business has `is_enabled = true` + API key + location id (or a
// webhook_url), events are marked `skipped` in the outbox and nothing leaves
// the server. Flip the settings in the dashboard to go live — no code changes.
//
// This is the ONLY file that talks to GHL. All deliveries carry an idempotency
// id (outbox.id) so retries never double-fire GHL workflows.

import { getServiceSupabase } from "./supabase";
import { isSafeWebhookUrl } from "./validators";

export type GhlEvent =
  | "review_submitted" | "positive_review" | "negative_review" | "platform_clicked" | "google_clicked"
  | "coupon_requested" | "coupon_approved" | "coupon_sent" | "manual_followup_required"
  | "auth_email" | "system_alert";

export interface GhlSettings {
  business_id: string;
  ghl_location_id: string | null;
  ghl_api_key: string | null;
  webhook_url: string | null;
  positive_tag: string | null;
  negative_tag: string | null;
  coupon_tag: string | null;
  google_clicked_tag: string | null;
  workflow_positive_id: string | null;
  workflow_negative_id: string | null;
  workflow_coupon_id: string | null;
  pipeline_id: string | null;
  opportunity_stage_negative: string | null;
  opportunity_stage_coupon_pending: string | null;
  is_enabled: boolean;
}

const API_BASE = process.env.GHL_DEFAULT_API_BASE || "https://services.leadconnectorhq.com";
const API_VERSION = process.env.GHL_DEFAULT_API_VERSION || "2021-07-28";
const TIMEOUT_MS = 3000;

export async function loadSettings(business_id: string): Promise<GhlSettings | null> {
  const sb = getServiceSupabase();
  const { data } = await sb.from("ghl_settings").select("*").eq("business_id", business_id).maybeSingle();
  return (data as GhlSettings | null) ?? null;
}

export function isApiConfigured(s: GhlSettings | null): s is GhlSettings {
  return !!(s && s.is_enabled && s.ghl_api_key && s.ghl_location_id);
}
export function isWebhookConfigured(s: GhlSettings | null): s is GhlSettings {
  return !!(s && s.is_enabled && s.webhook_url && isSafeWebhookUrl(s.webhook_url));
}
export function isConfigured(s: GhlSettings | null): boolean {
  return isApiConfigured(s) || isWebhookConfigured(s);
}

export async function logEvent(args: {
  business_id: string; review_id?: string | null; event: GhlEvent;
  payload: unknown; status_code?: number | null; response?: unknown; error?: string | null;
}) {
  const sb = getServiceSupabase();
  await sb.from("ghl_event_log").insert({
    business_id: args.business_id,
    review_id: args.review_id ?? null,
    event: args.event,
    payload: args.payload as any,
    status_code: args.status_code ?? null,
    response: (args.response as any) ?? null,
    error: args.error ?? null,
  });
}

function authHeaders(api_key: string) {
  return { Authorization: `Bearer ${api_key}`, "Content-Type": "application/json", Version: API_VERSION };
}

async function ghlFetch(url: string, init: RequestInit): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

// ---------------------------------------------------------------------------
// Primitive operations (each is a no-op when not configured)
// ---------------------------------------------------------------------------

export interface ContactInput {
  first_name?: string | null; last_name?: string | null;
  phone?: string | null; email?: string | null;
  custom?: Record<string, unknown>; tags?: string[];
}

export async function createOrUpdateContact(s: GhlSettings, c: ContactInput, ctx: { review_id?: string | null; event: GhlEvent }): Promise<string | null> {
  if (!isApiConfigured(s)) return null;
  if (!c.phone && !c.email) return null; // GHL would create junk contacts
  const body = {
    locationId: s.ghl_location_id,
    firstName: c.first_name ?? "",
    lastName: c.last_name ?? "",
    phone: c.phone ?? undefined,
    email: c.email ?? undefined,
    source: "ReviewFlow AI",
    tags: c.tags,
    customFields: c.custom ? Object.entries(c.custom).map(([key, v]) => ({ key, field_value: String(v ?? "") })) : undefined,
  };
  const r = await ghlFetch(`${API_BASE}/contacts/upsert`, { method: "POST", headers: authHeaders(s.ghl_api_key!), body: JSON.stringify(body) });
  await logEvent({ business_id: s.business_id, review_id: ctx.review_id, event: ctx.event, payload: body, status_code: r.status, response: r.body, error: r.ok ? null : `contact upsert ${r.status}` });
  if (!r.ok) throw new Error(`GHL contact upsert failed: ${r.status}`);
  return r.body?.contact?.id ?? r.body?.id ?? null;
}

export async function addTags(s: GhlSettings, contact_id: string, tags: string[], ctx: { review_id?: string | null; event: GhlEvent }) {
  if (!isApiConfigured(s) || tags.length === 0) return;
  const r = await ghlFetch(`${API_BASE}/contacts/${contact_id}/tags`, { method: "POST", headers: authHeaders(s.ghl_api_key!), body: JSON.stringify({ tags }) });
  if (!r.ok) await logEvent({ business_id: s.business_id, review_id: ctx.review_id, event: ctx.event, payload: { contact_id, tags }, status_code: r.status, error: `addTags ${r.status}` });
}

export async function createOpportunity(s: GhlSettings, args: { contact_id: string; name: string; stage_id: string | null; ctx: { review_id?: string | null; event: GhlEvent } }) {
  if (!isApiConfigured(s) || !s.pipeline_id || !args.stage_id) return null;
  const body = { pipelineId: s.pipeline_id, locationId: s.ghl_location_id, name: args.name, pipelineStageId: args.stage_id, status: "open", contactId: args.contact_id };
  const r = await ghlFetch(`${API_BASE}/opportunities/`, { method: "POST", headers: authHeaders(s.ghl_api_key!), body: JSON.stringify(body) });
  await logEvent({ business_id: s.business_id, review_id: args.ctx.review_id, event: args.ctx.event, payload: body, status_code: r.status, response: r.body, error: r.ok ? null : `opportunity ${r.status}` });
  return r.body?.opportunity?.id ?? null;
}

/** Posts to the business's inbound-webhook (GHL workflow trigger). Idempotent via event id. */
export async function triggerWebhook(s: GhlSettings, event: GhlEvent, payload: Record<string, unknown>, ctx: { review_id?: string | null; event_id: string }) {
  if (!isWebhookConfigured(s)) return;
  const body = { event, event_id: ctx.event_id, business_id: s.business_id, sent_at: new Date().toISOString(), ...payload };
  const res = await fetch(s.webhook_url!, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-ReviewFlow-Event": event, "X-ReviewFlow-Event-Id": ctx.event_id },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  await logEvent({ business_id: s.business_id, review_id: ctx.review_id, event, payload: body, status_code: res.status, error: res.ok ? null : `webhook ${res.status}` });
  if (!res.ok) throw new Error(`webhook ${res.status}`);
}

/** Trigger a GHL workflow by id for a contact (used for coupon delivery / alerts). */
export async function triggerWorkflow(s: GhlSettings, workflow_id: string | null, contact_id: string, ctx: { review_id?: string | null; event: GhlEvent }) {
  if (!isApiConfigured(s) || !workflow_id) return;
  const r = await ghlFetch(`${API_BASE}/contacts/${contact_id}/workflow/${workflow_id}`, { method: "POST", headers: authHeaders(s.ghl_api_key!), body: JSON.stringify({ eventStartTime: new Date().toISOString() }) });
  await logEvent({ business_id: s.business_id, review_id: ctx.review_id, event: ctx.event, payload: { workflow_id, contact_id }, status_code: r.status, error: r.ok ? null : `workflow ${r.status}` });
}

// ---------------------------------------------------------------------------
// Event dispatcher — called by the outbox processor for every event
// ---------------------------------------------------------------------------

export type DispatchResult = "sent" | "skipped";

export async function dispatchEvent(s: GhlSettings | null, event: GhlEvent, payload: any, ctx: { event_id: string; review_id?: string | null; business_name?: string }): Promise<DispatchResult> {
  if (!isConfigured(s)) return "skipped";
  const settings = s!;
  const customer = payload?.customer ?? {};
  const consent = customer.consent === true;

  // 1) Contact + tags (only if the customer consented to be contacted)
  let contact_id: string | null = null;
  if (isApiConfigured(settings) && consent && (customer.phone || customer.email)) {
    const [first, ...rest] = String(customer.full_name ?? "").trim().split(/\s+/);
    const tag =
      event === "negative_review" || event === "manual_followup_required" ? settings.negative_tag :
      event === "positive_review" ? settings.positive_tag :
      event === "coupon_approved" || event === "coupon_sent" || event === "coupon_requested" ? settings.coupon_tag :
      event === "google_clicked" ? settings.google_clicked_tag : null;
    contact_id = await createOrUpdateContact(settings, {
      first_name: first || null, last_name: rest.join(" ") || null,
      phone: customer.phone ?? null, email: customer.email ?? null,
      tags: tag ? [tag] : undefined,
      custom: {
        rf_review_id: payload.review_id, rf_rating: payload.rating, rf_sentiment: payload.sentiment,
        rf_route: payload.route, rf_summary: payload.summary, rf_review_text: payload.text,
        rf_platform_clicked: payload.platform, rf_coupon_code: payload?.coupon?.code, rf_coupon_status: payload?.coupon?.status,
        rf_business: ctx.business_name, rf_dashboard_link: `${process.env.APP_PUBLIC_URL ?? ""}/app/reviews?review=${payload.review_id ?? ""}`,
      },
    }, { review_id: ctx.review_id, event });

    if (contact_id) {
      if (event === "negative_review" || event === "manual_followup_required") {
        await createOpportunity(settings, { contact_id, name: `ביקורת שלילית — ${customer.full_name ?? "לקוח"}`, stage_id: settings.opportunity_stage_negative, ctx: { review_id: ctx.review_id, event } });
        await triggerWorkflow(settings, settings.workflow_negative_id, contact_id, { review_id: ctx.review_id, event });
      } else if (event === "positive_review") {
        await triggerWorkflow(settings, settings.workflow_positive_id, contact_id, { review_id: ctx.review_id, event });
      } else if (event === "coupon_approved" || event === "coupon_sent") {
        await triggerWorkflow(settings, settings.workflow_coupon_id, contact_id, { review_id: ctx.review_id, event });
      }
    }
  }

  // 2) Generic webhook (workflow inbound trigger) — carries the spec's WhatsApp alert fields
  if (isWebhookConfigured(settings)) {
    await triggerWebhook(settings, event, {
      ...payload,
      contact_id,
      alert_text: buildAlertText(event, payload, ctx.business_name),
      dashboard_link: `${process.env.APP_PUBLIC_URL ?? ""}/app/negative`,
    }, { review_id: ctx.review_id, event_id: ctx.event_id });
  }
  return "sent";
}

/** The WhatsApp owner-alert template from the product spec. */
export function buildAlertText(event: GhlEvent, p: any, business_name?: string): string | null {
  if (event !== "negative_review" && event !== "manual_followup_required") return null;
  const c = p?.customer ?? {};
  return [
    "⚠️ התקבלה ביקורת שלילית חדשה",
    "",
    `עסק: ${business_name ?? ""}`,
    `לקוח: ${c.full_name ?? "לא צוין"}`,
    `טלפון: ${c.phone ?? "לא צוין"}`,
    `דירוג: ${p?.rating ?? "?"}/5`,
    "",
    "תקציר:",
    p?.summary || p?.text || "",
    "",
    "לטיפול:",
    `${process.env.APP_PUBLIC_URL ?? ""}/app/negative`,
  ].join("\n");
}
