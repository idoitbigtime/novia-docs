# ReviewFlow AI

Hebrew-first (RTL, mobile-first) reputation platform for local businesses:
private feedback → AI triage → service recovery for unhappy customers → an
optional, **non-conditional** invitation to share publicly → a thank-you coupon
for giving feedback. Multi-tenant from day one. GoHighLevel integration layer
built in, delivered through a durable outbox.

Live: `https://reviewflow-il.netlify.app` · Repo path: `app/reviewflow-ai/`

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind, React Router |
| Backend | Netlify Functions (Node 22) + one scheduled sweeper |
| Data / Auth | Supabase Postgres (RLS everywhere) + Supabase Auth |
| AI | OpenAI (3s budget) with a deterministic rules layer and a Hebrew heuristic fallback |
| CRM | GoHighLevel — built, **disconnected until configured** per business |
| Tests | Vitest (rules, validators) · Playwright (customer flow on iPhone SE / 360px) · GitHub Actions |

## How a review flows

```
QR → /r/{slug} ─ track-visit ─► rate + text (+ optional contact, explicit consent)
      │
      ▼ POST /api/submit-review
  classifyReview()  — LLM advises; applyRoutingRules() decides:
    1. rating ≤ 3 → recovery_flow
    2. severe complaint → recovery_flow
    3. rating ≥ 4 → positive_flow
    4. manual_review only when the real LLM is confident
      │
      ▼ submit_review_tx()  (ONE transaction, service-role only)
  customer upsert (phone-normalised) + review + coupon (every route) + outbox event
      │
      ├─ positive / manual → /thanks     ┐  identical blocks on both pages:
      └─ recovery          → /recovery   ┘  [CouponBlock] → [SharePlatforms] → done
```

Compliance by design: platform links are shown to **everyone**, with identical
copy and placement; the coupon rewards *feedback* and is never conditioned on
posting. `tests/e2e/customer-flow.spec.ts` asserts this invariant.

## Project layout

```
src/
  pages/customer/      ReviewLanding · ThanksPage · RecoveryFlow · CouponClaimed
  pages/auth/          Login (signup/forgot) · ResetPassword
  pages/dashboard/     Overview · Reviews · Negative · Coupons · Platforms · QrCodes · Settings · Onboarding · Admin
  components/          StarRating (a11y radiogroup) · BrandedShell · customer/{CouponBlock,SharePlatforms}
  lib/                 supabase · publicApi · businessContext · errors (he) · format (he-IL) · types

netlify/functions/
  submit-review        validation → AI → submit_review_tx → inline outbox delivery (≤2.5s)
  recovery-details     writes review-level contact fields only (never mutates customers)
  platform-click       validated platform, platform_clicks row, analytics event
  claim-coupon         read-only re-fetch (direct link / manual polling)
  create-business      JWT-verified → create_business_with_owner RPC, per-user quota
  set-ghl-key          owner-only write of the API key (clients can never read it back)
  track-visit          top-of-funnel visits (deduped per visitor/hour)
  process-outbox       scheduled */10min: retries with backoff, row locks, daily failed-alert
  auth-email-hook      Supabase "Send Email" hook → GHL (built, not enabled yet)
  _shared/             http · validators · ai · ghlService · outbox · supabase

supabase/migrations/   0001 schema · 0002 RLS · 0003 seed · 0004 hardening · 0005 security+integrity+RPCs
tests/                 unit/ (vitest) · e2e/ (playwright)
```

## Security model (what is actually enforced)

- Every client read/write goes through Supabase Auth + RLS. Roles: platform admin
  (`profiles.is_platform_admin`, **not** self-editable — column UPDATE revoked),
  `business_owner`, `business_staff`, `agency_admin` via `auth_business_role()`.
- Staff can edit but not delete; `review_requests`, `ghl_event_log`, `outbox`,
  `platform_clicks` are read-only for clients.
- Anonymous customers reach the DB only through `public_business_page(slug)`
  (security definer, returns brand + active platforms). No anon table policies.
- `ghl_settings.ghl_api_key` has its SELECT privilege revoked for `authenticated`;
  the dashboard reads `has_api_key` and writes the key via `set-ghl-key`.
- All mutating RPCs are `security definer` with EXECUTE revoked from
  `anon`/`authenticated` — callable only with the service-role key, server-side.
- Public endpoints: integer rating 1–5, text ≤ 2000, E.164 phone, strict email,
  60 reviews/IP/hour (a venue shares one NAT IP), 2000/business/day, per-review
  caps on click/recovery calls, CORS pinned to `APP_PUBLIC_URL`, error *codes* only.

## GoHighLevel (disconnected by default)

`netlify/functions/_shared/ghlService.ts` is the only file that talks to GHL.
Every event is written to `outbox`; `dispatchEvent()` returns `skipped` until a
business has `is_enabled` + API key + location id (or a safe `https` webhook).
Contacts are created/tagged **only** for customers who ticked consent.
Events: `positive_review`, `negative_review`, `manual_followup_required`,
`platform_clicked` / `google_clicked`, `coupon_*`, `auth_email`, `system_alert`.
Deliveries carry `X-ReviewFlow-Event-Id` for idempotency.

To go live: Dashboard → Settings → GoHighLevel → enable + Location ID + API key
(+ Inbound Webhook URL and workflow ids). No code changes.

## Environment

```
# client (build-time)
VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# functions
SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, APP_PUBLIC_URL
OPENAI_API_KEY (optional), OPENAI_MODEL=gpt-4o-mini
GHL_DEFAULT_API_BASE, GHL_DEFAULT_API_VERSION
# auth e-mail via GHL (only when enabling the hook)
SUPABASE_AUTH_HOOK_SECRET, GHL_AUTH_EMAIL_WEBHOOK_URL
```

## Local development

```bash
npm install
cp .env.example .env            # fill in Supabase keys
npm run dev                     # Vite :5173 (functions need `npx netlify dev`)
npm run typecheck && npm test   # tsc + vitest
npm run test:e2e                # Playwright (API mocked, no network needed)
```

## Database

Apply `supabase/migrations/*.sql` in order. 0005 contains `drop`/`revoke`
statements; if applying through an MCP that requires approval per destructive
statement, paste it into the Supabase SQL Editor instead. Keep **Confirm email
OFF** in Supabase Auth until the GHL e-mail hook is enabled.

## Roadmap (next)

Dashboard mobile shell + UI kit → Negative-page customer contact + manual-review
queue → review drawer + actions → coupon delivery via GHL (unlocks manual mode)
→ charts/funnel → business profile + logo upload → campaigns/locations QR →
team invites → agencies & billing.
