-- ReviewFlow AI — initial schema
-- Multi-tenant: Platform → Agency → Business → Location → Review/Coupon/Customer
-- RLS-first. All client access goes through Supabase Auth; service-role bypasses RLS for server-side jobs.

set check_function_bodies = off;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- =========================================================================
-- ENUMS
-- =========================================================================
create type platform_role     as enum ('platform_admin', 'agency_admin', 'business_owner', 'business_staff');
create type sentiment_t       as enum ('positive', 'neutral', 'negative');
create type review_route_t    as enum ('positive_flow', 'recovery_flow', 'manual_review');
create type review_status_t   as enum ('new', 'in_progress', 'contacted', 'resolved', 'ignored', 'handled');
create type coupon_status_t   as enum ('pending', 'approved', 'sent', 'redeemed', 'expired', 'rejected');
create type discount_type_t   as enum ('percent', 'fixed', 'custom_text');
create type verification_t    as enum ('none', 'click', 'manual', 'api');
create type ghl_event_t       as enum (
  'review_submitted','positive_review','negative_review','google_clicked',
  'coupon_requested','coupon_approved','coupon_sent','manual_followup_required'
);

-- =========================================================================
-- TENANCY
-- =========================================================================
create table agencies (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         citext unique not null,
  white_label  jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table businesses (
  id           uuid primary key default gen_random_uuid(),
  agency_id    uuid references agencies(id) on delete set null,
  name         text not null,
  slug         citext unique not null,
  logo_url     text,
  brand_color  text not null default '#6d28d9',
  welcome_text text,
  default_lang text not null default 'he',
  timezone     text not null default 'Asia/Jerusalem',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index on businesses(agency_id);

create table locations (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,
  slug         citext not null,
  address      text,
  phone        text,
  created_at   timestamptz not null default now(),
  unique (business_id, slug)
);
create index on locations(business_id);

-- =========================================================================
-- IDENTITY & ACCESS (mirrors auth.users)
-- =========================================================================
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        citext not null,
  full_name    text,
  is_platform_admin boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Memberships: a user can belong to many businesses (and many agencies).
create table memberships (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  business_id  uuid references businesses(id) on delete cascade,
  agency_id    uuid references agencies(id) on delete cascade,
  role         platform_role not null,
  created_at   timestamptz not null default now(),
  check (business_id is not null or agency_id is not null)
);
create index on memberships(user_id);
create index on memberships(business_id);
create index on memberships(agency_id);

-- =========================================================================
-- CUSTOMER (end consumer who leaves feedback). No login. Deduped per business.
-- =========================================================================
create table customers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  full_name    text,
  phone        text,
  email        citext,
  created_at   timestamptz not null default now()
);
create index on customers(business_id);
create index on customers(business_id, phone);
create index on customers(business_id, email);

-- =========================================================================
-- REVIEW PLATFORMS (per business — Google, Facebook, Easy, Tripadvisor, custom)
-- =========================================================================
create table review_platforms (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  kind         text not null, -- 'google'|'facebook'|'easy'|'tripadvisor'|'zaprest'|'trustpilot'|'dapeizahav'|'custom'
  display_name text not null,
  icon         text,
  review_url   text not null,
  is_active    boolean not null default true,
  display_order int not null default 0,
  created_at   timestamptz not null default now()
);
create index on review_platforms(business_id);

-- =========================================================================
-- CAMPAIGNS (a tracked source: QR sticker, WhatsApp blast, email link…)
-- =========================================================================
create table campaigns (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  location_id  uuid references locations(id) on delete set null,
  name         text not null,
  slug         citext not null,
  source       text, -- 'qr'|'whatsapp'|'sms'|'email'|'nfc'|'link'
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (business_id, slug)
);
create index on campaigns(business_id);

-- =========================================================================
-- REVIEW REQUESTS (page visits) + REVIEWS (submissions)
-- =========================================================================
create table review_requests (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  location_id  uuid references locations(id) on delete set null,
  campaign_id  uuid references campaigns(id) on delete set null,
  visitor_token text,                            -- anonymous cookie/uuid
  ip           inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);
create index on review_requests(business_id, created_at desc);

create table reviews (
  id                       uuid primary key default gen_random_uuid(),
  business_id              uuid not null references businesses(id) on delete cascade,
  location_id              uuid references locations(id) on delete set null,
  campaign_id              uuid references campaigns(id) on delete set null,
  request_id               uuid references review_requests(id) on delete set null,
  customer_id              uuid references customers(id) on delete set null,

  rating                   int not null check (rating between 1 and 5),
  text                     text,
  language                 text not null default 'he',

  -- AI output
  ai_sentiment             sentiment_t,
  ai_route                 review_route_t,
  ai_confidence            numeric(4,3),
  ai_summary               text,
  ai_suggested_response    text,
  ai_tags                  text[] not null default '{}',
  ai_raw                   jsonb,

  -- Lifecycle
  status                   review_status_t not null default 'new',
  status_notes             text,

  -- Verification of public posting
  platform_clicked         text,
  platform_clicked_at      timestamptz,
  verification_method      verification_t not null default 'none',
  verified_external_review boolean not null default false,
  external_review_id       text,
  external_review_url      text,
  screenshot_url           text,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index on reviews(business_id, created_at desc);
create index on reviews(business_id, status);
create index on reviews(business_id, ai_route);
create index on reviews(business_id, ai_sentiment);

-- =========================================================================
-- COUPONS
-- =========================================================================
create table coupons (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  review_id       uuid references reviews(id) on delete set null,
  customer_id     uuid references customers(id) on delete set null,
  code            text not null,
  status          coupon_status_t not null default 'pending',
  discount_type   discount_type_t not null,
  discount_value  text not null,                 -- '10', '50', 'קפה חינם'
  expiration_date date,
  max_uses        int not null default 1,
  uses_count      int not null default 0,
  created_at      timestamptz not null default now(),
  approved_at     timestamptz,
  sent_at         timestamptz,
  redeemed_at     timestamptz,
  unique (business_id, code)
);
create index on coupons(business_id, status);
create index on coupons(review_id);

-- =========================================================================
-- GHL INTEGRATION (per business)
-- =========================================================================
create table ghl_settings (
  business_id          uuid primary key references businesses(id) on delete cascade,
  ghl_location_id      text,
  ghl_api_key          text,                -- encrypted at rest in Supabase; never returned to client
  webhook_url          text,
  positive_tag         text default 'reviewflow-positive',
  negative_tag         text default 'reviewflow-negative',
  coupon_tag           text default 'reviewflow-coupon',
  google_clicked_tag   text default 'reviewflow-google-clicked',
  workflow_positive_id text,
  workflow_negative_id text,
  workflow_coupon_id   text,
  pipeline_id          text,
  opportunity_stage_negative      text,
  opportunity_stage_coupon_pending text,
  is_enabled           boolean not null default false,
  updated_at           timestamptz not null default now()
);

create table ghl_event_log (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references businesses(id) on delete cascade,
  review_id     uuid references reviews(id) on delete set null,
  event         ghl_event_t not null,
  payload       jsonb not null,
  status_code   int,
  response      jsonb,
  error         text,
  created_at    timestamptz not null default now()
);
create index on ghl_event_log(business_id, created_at desc);

-- =========================================================================
-- COUPON CODE GENERATOR
-- =========================================================================
create or replace function generate_coupon_code(prefix text default 'RFAI')
returns text
language plpgsql
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code     text := '';
  i        int;
begin
  for i in 1..6 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return prefix || '-' || code;
end;
$$;

-- =========================================================================
-- updated_at TRIGGER
-- =========================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger trg_businesses_updated_at  before update on businesses for each row execute function set_updated_at();
create trigger trg_agencies_updated_at    before update on agencies   for each row execute function set_updated_at();
create trigger trg_reviews_updated_at     before update on reviews    for each row execute function set_updated_at();
create trigger trg_ghl_settings_updated_at before update on ghl_settings for each row execute function set_updated_at();

-- =========================================================================
-- PROFILE BOOTSTRAP TRIGGER
-- =========================================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
