// GoHighLevel integration service.
// Per-business credentials are stored in `ghl_settings`. This file is the
// ONLY place that talks to GHL. Anything we send out goes through one of
// the functions below and is logged to `ghl_event_log`.

import { getServiceSupabase } from "./supabase";

export type GhlEvent =
  | "review_submitted" | "positive_review" | "negative_review" | "google_clicked"
  | "coupon_requested" | "coupon_approved" | "coupon_sent" | "manual_followup_required";

interface ContactInput {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  email?: string | null;
  business_name?: string;
  custom?: Record<string, unknown>;
}

async function loadSettings(business_id: string) {
  const sb = getServiceSupabase();
  const { data } = await sb.from("ghl_settings").select("*").eq("business_id", business_id).maybeSingle();
  return data;
}

async function logEvent(args: {
  business_id: string; review_id?: string | null; event: GhlEvent;
  payload: unknown; status_code?: number; response?: unknown; error?: string | null;
}) {
  const sb = getServiceSupabase();
  await sb.from("ghl_event_log").insert({
    business_id: args.business_id,
    review_id: args.review_id ?? null,
    event: args.event,
    payload: args.payload,
    status_code: args.status_code ?? null,
    response: args.response ?? null,
    error: args.error ?? null,
  });
}

function authHeaders(api_key: string) {
  return {
    Authorization: `Bearer ${api_key}`,
    "Content-Type": "application/json",
    Version: process.env.GHL_DEFAULT_API_VERSION || "2021-07-28",
  };
}

const API_BASE = process.env.GHL_DEFAULT_API_BASE || "https://services.leadconnectorhq.com";

export async function createOrUpdateContact(business_id: string, c: ContactInput): Promise<string | null> {
  const s = await loadSettings(business_id);
  if (!s?.is_enabled || !s.ghl_api_key || !s.ghl_location_id) return null;
  const body = {
    locationId: s.ghl_location_id,
    firstName: c.first_name ?? "",
    lastName: c.last_name ?? "",
    phone: c.phone ?? undefined,
    email: c.email ?? undefined,
    source: "ReviewFlow AI",
    customFields: c.custom ? Object.entries(c.custom).map(([k, v]) => ({ key: k, field_value: String(v) })) : undefined,
  };
  try {
    const res = await fetch(`${API_BASE}/contacts/upsert`, {
      method: "POST", headers: authHeaders(s.ghl_api_key), body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    await logEvent({ business_id, event: "review_submitted", payload: body, status_code: res.status, response: j });
    return (j?.contact?.id || j?.id) ?? null;
  } catch (e: any) {
    await logEvent({ business_id, event: "review_submitted", payload: body, error: e.message });
    return null;
  }
}

export async function addTags(business_id: string, contact_id: string, tags: string[]) {
  const s = await loadSettings(business_id);
  if (!s?.is_enabled || !s.ghl_api_key || tags.length === 0) return;
  await fetch(`${API_BASE}/contacts/${contact_id}/tags`, {
    method: "POST", headers: authHeaders(s.ghl_api_key), body: JSON.stringify({ tags }),
  }).catch(() => undefined);
}

export async function triggerWebhook(business_id: string, payload: unknown) {
  const s = await loadSettings(business_id);
  if (!s?.is_enabled || !s.webhook_url) return;
  try {
    const res = await fetch(s.webhook_url, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    await logEvent({ business_id, event: "review_submitted", payload, status_code: res.status });
  } catch (e: any) {
    await logEvent({ business_id, event: "review_submitted", payload, error: e.message });
  }
}

// High-level: route a review to GHL according to its AI classification.
export async function syncReviewToGHL(args: {
  business_id: string; review_id: string;
  rating: number; text: string | null;
  sentiment: string | null; route: string | null;
  customer: { full_name?: string | null; phone?: string | null; email?: string | null } | null;
}) {
  const s = await loadSettings(args.business_id);
  if (!s?.is_enabled) return;

  const [first_name, ...rest] = (args.customer?.full_name ?? "").trim().split(/\s+/);
  const last_name = rest.join(" ") || null;
  const tagPos = s.positive_tag ?? "reviewflow-positive";
  const tagNeg = s.negative_tag ?? "reviewflow-negative";
  const tag = args.route === "recovery_flow" ? tagNeg : tagPos;
  const event: GhlEvent = args.route === "recovery_flow" ? "negative_review" : "positive_review";

  const contact_id = await createOrUpdateContact(args.business_id, {
    first_name, last_name,
    phone: args.customer?.phone, email: args.customer?.email,
    custom: {
      rf_review_id: args.review_id,
      rf_rating: args.rating,
      rf_sentiment: args.sentiment ?? "",
      rf_review_text: args.text ?? "",
    },
  });
  if (contact_id) await addTags(args.business_id, contact_id, [tag]);
  await triggerWebhook(args.business_id, { event, business_id: args.business_id, review_id: args.review_id, contact_id, rating: args.rating, text: args.text, sentiment: args.sentiment });
  await logEvent({ business_id: args.business_id, review_id: args.review_id, event, payload: { contact_id, tag } });
}
