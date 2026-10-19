export type Sentiment = "positive" | "neutral" | "negative";
export type ReviewRoute = "positive_flow" | "recovery_flow" | "manual_review";
export type ReviewStatus = "new" | "in_progress" | "contacted" | "resolved" | "ignored" | "handled";
export type CouponStatus = "pending" | "approved" | "sent" | "redeemed" | "expired" | "rejected";
export type DiscountType = "percent" | "fixed" | "custom_text";
export type VerificationMethod = "none" | "click" | "manual" | "api";
export type MemberRole = "platform_admin" | "agency_admin" | "business_owner" | "business_staff";

export interface BusinessBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  welcome_text: string | null;
  default_lang: string;
}

export interface ReviewPlatform {
  id: string;
  business_id?: string;
  kind: string;
  display_name: string;
  icon: string | null;
  review_url: string;
  is_active?: boolean;
  display_order: number;
}

/** Result of the public_business_page RPC. */
export interface PublicBusinessPage {
  business: BusinessBrand;
  platforms: ReviewPlatform[];
  coupon: { terms_text: string; approval_mode: "auto" | "manual" } | null;
}

export interface Review {
  id: string;
  business_id: string;
  campaign_id: string | null;
  customer_id: string | null;
  rating: number;
  text: string | null;
  language: string;
  ai_sentiment: Sentiment | null;
  ai_route: ReviewRoute | null;
  ai_confidence: number | null;
  ai_summary: string | null;
  ai_suggested_response: string | null;
  ai_tags: string[];
  ai_fallback_used: boolean;
  status: ReviewStatus;
  status_notes: string | null;
  customer_message: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  best_time: string | null;
  platform_clicked: string | null;
  platform_clicked_at: string | null;
  verification_method: VerificationMethod;
  verified_external_review: boolean;
  external_review_url: string | null;
  screenshot_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  business_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  marketing_consent_at: string | null;
  created_at: string;
}

export interface Coupon {
  id: string;
  business_id: string;
  review_id: string | null;
  customer_id: string | null;
  code: string;
  status: CouponStatus;
  discount_type: DiscountType;
  discount_value: string;
  expiration_date: string | null;
  max_uses: number;
  uses_count: number;
  created_at: string;
  approved_at: string | null;
  sent_at: string | null;
  redeemed_at: string | null;
}

/** Coupon shape returned to the customer flow (code hidden unless approved/sent). */
export interface CustomerCoupon {
  status: CouponStatus;
  code?: string | null;
  discount_type: DiscountType;
  discount_value: string;
  expiration_date: string | null;
  terms_text: string | null;
}

export interface CouponSettings {
  business_id: string;
  approval_mode: "auto" | "manual";
  discount_type: DiscountType;
  discount_value: string;
  expiry_days: number;
  max_uses: number;
  terms_text: string;
}

export interface GhlSettingsSafe {
  business_id: string;
  ghl_location_id: string | null;
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
  has_api_key: boolean;
}

/** Columns the client is allowed to select on ghl_settings (ghl_api_key is revoked). */
export const GHL_SAFE_COLUMNS =
  "business_id, ghl_location_id, webhook_url, positive_tag, negative_tag, coupon_tag, google_clicked_tag, " +
  "workflow_positive_id, workflow_negative_id, workflow_coupon_id, pipeline_id, " +
  "opportunity_stage_negative, opportunity_stage_coupon_pending, is_enabled, has_api_key";

export interface BusinessStats {
  visits: number; reviews: number; avg_rating: number | null;
  positive: number; negative: number; manual: number; open_recovery: number;
  clicks: number; clicks_by_platform: Record<string, number>;
  coupons_issued: number; coupons_pending: number; coupons_redeemed: number;
  by_day: Array<{ day: string; reviews: number; positive: number; negative: number }>;
  sentiment: { positive: number; neutral: number; negative: number };
}

export interface SubmitReviewResponse {
  review_id: string;
  route: ReviewRoute;
  sentiment: Sentiment;
  coupon: CustomerCoupon;
}
