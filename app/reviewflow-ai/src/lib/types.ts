export type Sentiment = "positive" | "neutral" | "negative";
export type ReviewRoute = "positive_flow" | "recovery_flow" | "manual_review";
export type ReviewStatus = "new" | "in_progress" | "contacted" | "resolved" | "ignored" | "handled";
export type CouponStatus = "pending" | "approved" | "sent" | "redeemed" | "expired" | "rejected";

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
  business_id: string;
  kind: string;
  display_name: string;
  icon: string | null;
  review_url: string;
  display_order: number;
}

export interface Review {
  id: string;
  business_id: string;
  rating: number;
  text: string | null;
  ai_sentiment: Sentiment | null;
  ai_route: ReviewRoute | null;
  ai_confidence: number | null;
  ai_summary: string | null;
  ai_suggested_response: string | null;
  ai_tags: string[];
  status: ReviewStatus;
  platform_clicked: string | null;
  created_at: string;
  customer_id: string | null;
}

export interface Coupon {
  id: string;
  business_id: string;
  review_id: string | null;
  code: string;
  status: CouponStatus;
  discount_type: "percent" | "fixed" | "custom_text";
  discount_value: string;
  expiration_date: string | null;
  created_at: string;
}

export interface AIClassification {
  sentiment: Sentiment;
  route: ReviewRoute;
  confidence: number;
  summary: string;
  suggested_business_response: string;
  tags: string[];
}
