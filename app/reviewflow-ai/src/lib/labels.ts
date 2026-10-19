// Single source of Hebrew labels + badge tones for every enum shown in the dashboard.
import type { ReviewRoute, ReviewStatus, Sentiment, CouponStatus, MemberRole } from "./types";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

export const ROUTE: Record<ReviewRoute, { label: string; tone: Tone }> = {
  positive_flow: { label: "חיובית", tone: "success" },
  recovery_flow: { label: "לטיפול", tone: "danger" },
  manual_review: { label: "לבדיקה", tone: "warning" },
};

export const SENTIMENT: Record<Sentiment, { label: string; tone: Tone }> = {
  positive: { label: "חיובי", tone: "success" },
  neutral: { label: "ניטרלי", tone: "neutral" },
  negative: { label: "שלילי", tone: "danger" },
};

export const REVIEW_STATUS: Record<ReviewStatus, { label: string; tone: Tone }> = {
  new: { label: "חדש", tone: "info" },
  in_progress: { label: "בטיפול", tone: "warning" },
  contacted: { label: "יצרנו קשר", tone: "brand" },
  resolved: { label: "טופל", tone: "success" },
  handled: { label: "טופל", tone: "success" },
  ignored: { label: "נסגר ללא טיפול", tone: "neutral" },
};

export const COUPON_STATUS: Record<CouponStatus, { label: string; tone: Tone }> = {
  pending: { label: "ממתין לאישור", tone: "warning" },
  approved: { label: "מאושר", tone: "success" },
  sent: { label: "נשלח", tone: "info" },
  redeemed: { label: "מומש", tone: "brand" },
  expired: { label: "פג תוקף", tone: "neutral" },
  rejected: { label: "נדחה", tone: "danger" },
};

export const PLATFORM_KIND: Record<string, string> = {
  google: "Google", facebook: "Facebook", easy: "Easy", tripadvisor: "Tripadvisor",
  zaprest: "זאפ רסט", trustpilot: "Trustpilot", dapeizahav: "דפי זהב", custom: "אחר",
};

export const ROLE: Record<MemberRole, string> = {
  platform_admin: "מנהל פלטפורמה", agency_admin: "מנהל סוכנות", business_owner: "בעלים", business_staff: "צוות",
};

export const OUTBOX_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "ממתין", tone: "neutral" },
  processing: { label: "בשליחה", tone: "info" },
  sent: { label: "נשלח", tone: "success" },
  skipped: { label: "דולג (לא מחובר)", tone: "neutral" },
  failed: { label: "נכשל", tone: "danger" },
};

export const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-700",
  info: "bg-sky-100 text-sky-800",
  brand: "bg-violet-100 text-violet-800",
};
