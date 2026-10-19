import { test, expect, type Page } from "@playwright/test";

// ---- mocks ------------------------------------------------------------------
const PAGE = {
  business: { id: "b1", name: "מסעדת הדגים של דני", slug: "dani-fish", logo_url: null, brand_color: "#0ea5e9", welcome_text: "תודה שאכלתם אצלנו!", default_lang: "he" },
  platforms: [
    { id: "p1", kind: "google", display_name: "Google", icon: null, review_url: "https://g.page/r/demo", display_order: 1 },
    { id: "p2", kind: "facebook", display_name: "Facebook", icon: null, review_url: "https://facebook.com/demo", display_order: 2 },
  ],
  coupon: { terms_text: "ההטבה ניתנת על מתן משוב, ללא קשר לפרסום ביקורת.", approval_mode: "auto" },
};
const COUPON = { status: "approved", code: "RFAI-TEST42", discount_type: "custom_text", discount_value: "קפה חינם", expiration_date: "2030-01-01", terms_text: PAGE.coupon.terms_text };

async function mockApi(page: Page, opts: { route?: "positive_flow" | "recovery_flow" | "manual_review"; notFound?: boolean } = {}) {
  await page.route("**/rest/v1/rpc/public_business_page", (r) =>
    r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(opts.notFound ? null : PAGE) }));
  await page.route("**/api/track-visit", (r) => r.fulfill({ status: 200, body: "{}" }));
  await page.route("**/api/platform-click", (r) => r.fulfill({ status: 200, body: "{}" }));
  await page.route("**/api/recovery-details", (r) => r.fulfill({ status: 200, body: '{"ok":true}' }));
  await page.route("**/api/submit-review", async (r) => {
    const body = r.request().postDataJSON();
    const route = opts.route ?? (body.rating <= 3 ? "recovery_flow" : "positive_flow");
    await r.fulfill({ status: 200, contentType: "application/json",
      body: JSON.stringify({ review_id: "11111111-1111-4111-8111-111111111111", route, sentiment: "positive", coupon: COUPON }) });
  });
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "page must not scroll horizontally").toBeLessThanOrEqual(0);
}

async function rate(page: Page, stars: number) {
  await page.getByRole("radio", { name: ["כוכב אחד", "שני כוכבים", "שלושה כוכבים", "ארבעה כוכבים", "חמישה כוכבים"][stars - 1] }).click();
}

// ---- tests ------------------------------------------------------------------
test("landing renders branded, fits the viewport, stars are a radiogroup", async ({ page }) => {
  await mockApi(page);
  await page.goto("/r/dani-fish");
  await expect(page.getByRole("heading", { name: PAGE.business.name })).toBeVisible();
  await expect(page.getByRole("radiogroup")).toBeVisible();
  await noHorizontalScroll(page);
  const stars = page.getByRole("radio");
  await expect(stars).toHaveCount(5);
  for (const s of await stars.all()) {
    const box = await s.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  }
});

test("submit without rating shows an inline error, not a request", async ({ page }) => {
  await mockApi(page);
  let called = false;
  await page.route("**/api/submit-review", (r) => { called = true; r.fulfill({ status: 500 }); });
  await page.goto("/r/dani-fish");
  await page.getByRole("button", { name: "שליחה" }).click();
  await expect(page.getByRole("alert")).toContainText("נא לבחור דירוג");
  expect(called).toBe(false);
});

test("5★ → thanks page with coupon AND share block", async ({ page }) => {
  await mockApi(page);
  await page.goto("/r/dani-fish");
  await rate(page, 5);
  await page.getByRole("button", { name: "שליחה" }).click();
  await expect(page).toHaveURL(/\/r\/dani-fish\/thanks$/);
  await expect(page.getByText("RFAI-TEST42")).toBeVisible();
  await expect(page.getByRole("heading", { name: /נשמח אם תשתפו/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Google/ })).toHaveAttribute("href", PAGE.platforms[0].review_url);
  await noHorizontalScroll(page);
});

test("1★ → recovery page with the SAME coupon and SAME share block (no gating)", async ({ page }) => {
  await mockApi(page);
  await page.goto("/r/dani-fish");
  await rate(page, 1);
  await page.getByRole("button", { name: "שליחה" }).click();
  await expect(page).toHaveURL(/\/r\/dani-fish\/recovery$/);
  await expect(page.getByText("RFAI-TEST42")).toBeVisible();
  await expect(page.getByRole("heading", { name: /נשמח אם תשתפו/ })).toBeVisible();
  const links = page.getByRole("link", { name: /Google|Facebook/ });
  await expect(links).toHaveCount(2);
  await noHorizontalScroll(page);
});

test("compliance invariant: share block is identical across routes", async ({ page }) => {
  const snapshots: string[] = [];
  for (const route of ["positive_flow", "recovery_flow", "manual_review"] as const) {
    await mockApi(page, { route });
    await page.goto("/r/dani-fish");
    await rate(page, 5);
    await page.getByRole("button", { name: "שליחה" }).click();
    await expect(page.getByRole("heading", { name: /נשמח אם תשתפו/ })).toBeVisible();
    const html = await page.locator("section[aria-labelledby='share-h']").innerHTML();
    snapshots.push(html);
    // coupon must be present on every route too
    await expect(page.getByText("RFAI-TEST42")).toBeVisible();
  }
  expect(snapshots[0]).toBe(snapshots[1]);
  expect(snapshots[1]).toBe(snapshots[2]);
});

test("recovery form: server error is shown, success is shown only on 2xx", async ({ page }) => {
  await mockApi(page);
  await page.route("**/api/recovery-details", (r) => r.fulfill({ status: 500, contentType: "application/json", body: '{"error":"INTERNAL"}' }));
  await page.goto("/r/dani-fish");
  await rate(page, 2);
  await page.getByRole("button", { name: "שליחה" }).click();
  await page.getByLabel("טלפון").fill("0501234567");
  await page.getByRole("button", { name: "שלחו לטיפול" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText("קיבלנו את הפרטים")).toHaveCount(0);
});

test("unknown slug shows a not-found card (no endless loading)", async ({ page }) => {
  await mockApi(page, { notFound: true });
  await page.goto("/r/does-not-exist");
  await expect(page.getByText("העסק לא נמצא")).toBeVisible({ timeout: 5000 });
});

test("thanks page without state redirects back to the form", async ({ page }) => {
  await mockApi(page);
  await page.goto("/r/dani-fish/thanks");
  await expect(page).toHaveURL(/\/r\/dani-fish$/);
});
