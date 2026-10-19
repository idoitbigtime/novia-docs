// Client helpers for the anonymous customer flow.
import { supabase } from "./supabase";
import type { PublicBusinessPage, SubmitReviewResponse, ReviewRoute, CustomerCoupon } from "./types";

export async function fetchPublicPage(slug: string): Promise<PublicBusinessPage | null> {
  const { data, error } = await supabase.rpc("public_business_page", { p_slug: slug });
  if (error) throw error;
  return (data as PublicBusinessPage | null) ?? null;
}

const VISITOR_KEY = "rf:visitor";
export function visitorToken(): string {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) { v = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, v); }
    return v;
  } catch { return "anon"; }
}

/** Top-of-funnel visit; fire-and-forget. */
export function trackVisit(business_slug: string, campaign_slug?: string | null) {
  try {
    const body = JSON.stringify({ business_slug, campaign_slug: campaign_slug ?? undefined, visitor_token: visitorToken() });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/track-visit", new Blob([body], { type: "application/json" }));
    else fetch("/api/track-visit", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch { /* never block the page */ }
}

/** Record a platform click without blocking navigation (anchor click handler). */
export function beaconPlatformClick(review_id: string, platform: string) {
  try {
    const body = JSON.stringify({ review_id, platform });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/platform-click", new Blob([body], { type: "application/json" }));
    else fetch("/api/platform-click", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch { /* ignore */ }
}

// ---- last-review handoff between pages (survives refresh) --------------------
export interface LastReview { review_id: string; route: ReviewRoute; coupon: CustomerCoupon; rating: number; name?: string | null; phone?: string | null }
const lastKey = (slug: string) => `rf:lastReview:${slug}`;
export function saveLastReview(slug: string, v: LastReview) { try { sessionStorage.setItem(lastKey(slug), JSON.stringify(v)); } catch { /* ignore */ } }
export function loadLastReview(slug: string): LastReview | null {
  try { const s = sessionStorage.getItem(lastKey(slug)); return s ? (JSON.parse(s) as LastReview) : null; } catch { return null; }
}

export async function submitReview(payload: {
  business_slug: string; campaign_slug?: string | null; rating: number; text: string; consent: boolean;
  customer: { full_name: string | null; phone: string | null; email: string | null };
}): Promise<{ ok: true; data: SubmitReviewResponse } | { ok: false; res: Response }> {
  const res = await fetch("/api/submit-review", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, language: "he", visitor_token: visitorToken() }),
  });
  if (!res.ok) return { ok: false, res };
  return { ok: true, data: (await res.json()) as SubmitReviewResponse };
}
