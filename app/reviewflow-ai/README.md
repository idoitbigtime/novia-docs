# ReviewFlow AI

Reputation management, smart review routing, WhatsApp-first service recovery,
dynamic coupons and GoHighLevel integration for local businesses.
Hebrew-first, RTL, mobile-first.

This repository is the MVP core slice: customer review flow + AI routing +
GHL service layer + business dashboard. Multi-tenant from day one.

## Stack

- **Frontend** — React 18, TypeScript, Vite, Tailwind, React Router
- **Backend** — Netlify Functions (TypeScript, Node 22)
- **Database / Auth / Storage** — Supabase Postgres + RLS
- **AI** — OpenAI (gpt-4o-mini by default), heuristic fallback when no key
- **CRM** — GoHighLevel REST + webhooks (per-business credentials)

## Project layout

```
src/
  pages/customer/     # /r/:businessSlug review flow (anonymous)
  pages/auth/         # Supabase auth
  pages/dashboard/    # Business owner SaaS UI
  components/         # StarRating, BrandedShell, …
  lib/                # supabase client, types, business context

netlify/functions/
  submit-review.ts    # AI classification + persist + GHL sync
  platform-click.ts   # Track Google/FB click → tag in GHL
  recovery-details.ts # Negative-flow follow-up details
  claim-coupon.ts     # Generate dynamic coupon
  _shared/            # supabase, openai, GHL service, http helpers

supabase/migrations/
  0001_init_schema.sql # All tables (multi-tenant)
  0002_rls.sql         # RLS policies + helper functions
  0003_seed.sql        # Demo business + platforms
```

## Local setup

```bash
npm install
cp .env.example .env
# fill in VITE_SUPABASE_*, SUPABASE_*, OPENAI_API_KEY
npm run dev               # Vite at :5173
npx netlify dev           # Netlify dev with functions (optional)
```

## Database setup

Apply migrations in order via the Supabase SQL editor or the CLI:

```bash
supabase db push          # if using the CLI with a linked project
# or paste each file in dashboard → SQL Editor
```

The seed inserts a demo business `dani-fish`. After signing up a user, run:

```sql
update profiles set is_platform_admin = true where email = 'YOU@example.com';
insert into memberships (user_id, business_id, role)
  values ('<your-user-id>', '11111111-1111-1111-1111-111111111111', 'business_owner');
```

Then visit:

- `http://localhost:5173/r/dani-fish` — customer review page
- `http://localhost:5173/app` — owner dashboard

## Customer flow

1. Customer scans QR → `/r/:businessSlug` (anonymous).
2. Picks 1–5 stars and optional text/contact → POST `/api/submit-review`.
3. The function classifies the review (OpenAI), persists it, fires off a
   GHL sync, and returns the route: `positive_flow` or `recovery_flow`.
4. **Positive** → thank-you page with branded platform buttons. Each click
   is tracked; once the customer presses "פרסמתי" they reach the coupon page.
5. **Recovery** → thank-you-for-honesty page with a contact form; details
   are saved and a `manual_followup_required` event hits GHL.

## GoHighLevel integration

Per-business credentials live in `ghl_settings`. The only code that
talks to GHL is `netlify/functions/_shared/ghlService.ts`. Every outbound
call is logged in `ghl_event_log` for audit/debug.

Events emitted: `review_submitted`, `positive_review`, `negative_review`,
`google_clicked`, `coupon_requested`, `coupon_approved`, `coupon_sent`,
`manual_followup_required`.

## Security notes

- All client access goes through Supabase Auth + RLS — a user can only
  see businesses they have a `memberships` row for.
- Anonymous customers can only read `public_business_brand` and
  `public_review_platforms` views.
- All mutations during the customer flow go through Netlify Functions
  that use the **service-role** key (kept server-side only).
- GHL API keys never leave the server.

## Roadmap (out of this slice)

- Agency white-label + subaccounts
- Stripe / Cardcom / Grow billing
- Direct WhatsApp Business API (currently routed via GHL)
- API-based external review verification (Google Places, etc.)
- Funnel and sentiment charts on the Overview page
- Per-business storage bucket for logos
