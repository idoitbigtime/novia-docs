import { test, expect, type Page } from "@playwright/test";

// Dashboard smoke on a phone viewport with Supabase mocked at the network layer.
// Verifies: auth gate, mobile shell (no sidebar overflow, bottom tabs), Hebrew labels,
// no horizontal scroll on list pages.

const USER = { id: "74089024-d5a6-4ba1-b0a5-49dba1700ff4", email: "owner@example.com" };
const BIZ = { id: "11111111-1111-1111-1111-111111111111", name: "מסעדת הדגים של דני", slug: "dani-fish" };

function session() {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const token = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: USER.id, email: USER.email, role: "authenticated", exp: now + 3600, aud: "authenticated" })}.sig`;
  return { access_token: token, refresh_token: "r", expires_in: 3600, expires_at: now + 3600, token_type: "bearer",
    user: { id: USER.id, email: USER.email, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } };
}

async function mockSupabase(page: Page) {
  // Seed a persisted session so RequireAuth passes without hitting the network.
  await page.addInitScript((s) => { localStorage.setItem("sb-example-auth-token", JSON.stringify(s)); }, session());
  await page.route("**/auth/v1/user**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session().user) }));
  await page.route("**/auth/v1/token**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session()) }));

  const review = { id: "22222222-2222-4222-8222-222222222222", business_id: BIZ.id, rating: 2, text: "המנה הגיעה קרה", ai_route: "recovery_flow", ai_sentiment: "negative",
    status: "new", ai_summary: "מנה קרה", ai_suggested_response: "מצטערים על החוויה", ai_tags: ["food"], contact_name: "דנה", contact_phone: "+972501234567",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(), customer_id: null, campaign_id: null, language: "he", ai_confidence: 0.9, ai_fallback_used: false,
    status_notes: null, customer_message: null, best_time: null, platform_clicked: null, platform_clicked_at: null, verification_method: "none", verified_external_review: false, external_review_url: null, screenshot_url: null, customers: null };

  await page.route("**/rest/v1/**", (route) => {
    const url = new URL(route.request().url());
    const table = url.pathname.split("/rest/v1/")[1]?.split("?")[0] ?? "";
    const json = (body: unknown, extra: Record<string, string> = {}) =>
      route.fulfill({ status: 200, contentType: "application/json", headers: { "content-range": "0-0/1", ...extra }, body: JSON.stringify(body) });
    const single = route.request().headers()["accept"]?.includes("vnd.pgrst.object");
    switch (table) {
      case "profiles": return json(single ? { is_platform_admin: true } : [{ is_platform_admin: true }]);
      case "memberships": return json(single ? { role: "business_owner", businesses: BIZ } : [{ role: "business_owner", businesses: BIZ }]);
      case "businesses": return json(single ? BIZ : [BIZ]);
      case "reviews": return json(single ? review : [review]);
      case "coupons": return json([]);
      case "outbox": return json([]);
      case "rpc/business_stats": return json({ visits: 10, reviews: 1, avg_rating: 2, positive: 0, negative: 1, manual: 0, open_recovery: 1, clicks: 0, clicks_by_platform: {}, coupons_issued: 1, coupons_pending: 0, coupons_redeemed: 0, by_day: [], sentiment: { positive: 0, neutral: 0, negative: 1 } });
      default: return json([]);
    }
  });
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("unauthenticated /app redirects to /login", async ({ page }) => {
  await page.route("**/rest/v1/**", (r) => r.fulfill({ status: 200, body: "[]" }));
  await page.route("**/auth/v1/**", (r) => r.fulfill({ status: 401, body: "{}" }));
  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "ReviewFlow AI" })).toBeVisible();
});

test("mobile dashboard shell: top bar, bottom tabs, drawer; no horizontal scroll", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("/app");
  await expect(page.getByRole("heading", { name: "סקירה" })).toBeVisible();
  await noHorizontalScroll(page);
  await expect(page.getByRole("navigation", { name: "ניווט מהיר" })).toBeVisible();
  await page.getByRole("button", { name: "תפריט" }).click();
  await expect(page.getByRole("dialog", { name: "תפריט ניווט" })).toBeVisible();
  await page.getByRole("dialog").getByRole("link", { name: /פלטפורמות/ }).click();
  await expect(page).toHaveURL(/\/app\/platforms$/);
  await noHorizontalScroll(page);
});

test("negative page shows Hebrew labels and a contact action", async ({ page }) => {
  await mockSupabase(page);
  await page.goto("/app/negative");
  const card = page.locator("article").first();
  await expect(card.getByText("דנה")).toBeVisible();
  await expect(card.getByText("לטיפול", { exact: true })).toBeVisible();     // route badge, Hebrew
  await expect(card.getByText("חדש", { exact: true })).toBeVisible();        // status badge, Hebrew
  await expect(card.getByRole("link", { name: /WhatsApp/ })).toHaveAttribute("href", /wa\.me\/972501234567/);
  await expect(page.locator("text=recovery_flow")).toHaveCount(0); // raw enums never leak into the UI
  await noHorizontalScroll(page);
});
