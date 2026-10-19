// Authenticated calls to our Netlify functions from the dashboard.
import { supabase } from "./supabase";
import { apiError } from "./errors";

async function authedPost<T>(path: string, body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await apiError(res));
  return (await res.json()) as T;
}

export const api = {
  couponAction: (coupon_id: string, action: "approve" | "reject" | "send" | "redeem") =>
    authedPost<{ ok: true; status: string }>("/api/coupon-action", { coupon_id, action }),
  regenerateReply: (review_id: string, tone?: "warm" | "formal" | "short", instructions?: string) =>
    authedPost<{ reply: string }>("/api/regenerate-reply", { review_id, tone, instructions }),
  resendGhl: (review_id: string) =>
    authedPost<{ ok: true; status: string; error: string | null }>("/api/resend-ghl", { review_id }),
  createBusiness: (payload: { name: string; slug?: string; brand_color?: string; welcome_text?: string }) =>
    authedPost<{ business: { id: string; name: string; slug: string } }>("/api/create-business", payload),
  setGhlKey: (business_id: string, api_key: string | null) =>
    authedPost<{ ok: true; has_api_key: boolean }>("/api/set-ghl-key", { business_id, api_key }),
};

export async function copyToClipboard(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

/** wa.me link with a prefilled Hebrew message. */
export function whatsappLink(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : null;
}
