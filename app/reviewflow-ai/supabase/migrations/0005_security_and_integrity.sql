-- ReviewFlow AI — 0005: security, integrity, RPCs, outbox
-- Fixes: privilege escalation via profiles, GHL key exposure, over-broad member
-- writes, anon table reads, duplicate coupons, customer dedupe, FK indexes,
-- RLS initplan, and adds the atomic RPCs the Netlify functions rely on.
-- Rollback notes at the bottom.

set check_function_bodies = off;

-- =========================================================================
-- 1. PROFILES — stop self-promotion to platform admin
-- =========================================================================
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_select on public.profiles for select
  using (id = (select auth.uid()) or auth_is_platform_admin());
create policy profiles_self_update on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- =========================================================================
-- 2. GHL SETTINGS — API key never reaches the browser
-- =========================================================================
alter table public.ghl_settings add column if not exists has_api_key boolean not null default false;

create or replace function public.ghl_settings_sync_flags()
returns trigger language plpgsql set search_path = public as $$
begin
  new.has_api_key := coalesce(new.ghl_api_key, '') <> '';
  return new;
end $$;
drop trigger if exists trg_ghl_settings_flags on public.ghl_settings;
create trigger trg_ghl_settings_flags before insert or update on public.ghl_settings
  for each row execute function public.ghl_settings_sync_flags();
update public.ghl_settings set has_api_key = coalesce(ghl_api_key,'') <> '';

revoke all on public.ghl_settings from authenticated, anon;
grant select (business_id, ghl_location_id, webhook_url, positive_tag, negative_tag, coupon_tag,
              google_clicked_tag, workflow_positive_id, workflow_negative_id, workflow_coupon_id,
              pipeline_id, opportunity_stage_negative, opportunity_stage_coupon_pending,
              is_enabled, has_api_key, updated_at)
  on public.ghl_settings to authenticated;
grant insert (business_id, ghl_location_id, webhook_url, positive_tag, negative_tag, coupon_tag,
              google_clicked_tag, workflow_positive_id, workflow_negative_id, workflow_coupon_id,
              pipeline_id, opportunity_stage_negative, opportunity_stage_coupon_pending, is_enabled)
  on public.ghl_settings to authenticated;
grant update (ghl_location_id, webhook_url, positive_tag, negative_tag, coupon_tag,
              google_clicked_tag, workflow_positive_id, workflow_negative_id, workflow_coupon_id,
              pipeline_id, opportunity_stage_negative, opportunity_stage_coupon_pending, is_enabled)
  on public.ghl_settings to authenticated;

-- =========================================================================
-- 3. ROLE HELPERS (owner-context, not callable by clients)
-- =========================================================================
create or replace function public.auth_business_role(b uuid)
returns platform_role language sql stable security definer set search_path = public as $$
  select m.role from memberships m
  where m.user_id = (select auth.uid())
    and (m.business_id = b or m.agency_id = (select agency_id from businesses where id = b))
  order by case m.role when 'agency_admin' then 0 when 'business_owner' then 1 else 2 end
  limit 1;
$$;
create or replace function public.auth_can_edit_business(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth_is_platform_admin()
      or auth_business_role(b) in ('agency_admin','business_owner','business_staff');
$$;
create or replace function public.auth_can_admin_business(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth_is_platform_admin()
      or auth_business_role(b) in ('agency_admin','business_owner');
$$;
revoke execute on function public.auth_business_role(uuid)     from public, anon, authenticated;
revoke execute on function public.auth_can_edit_business(uuid) from public, anon, authenticated;
revoke execute on function public.auth_can_admin_business(uuid) from public, anon, authenticated;

-- Re-create the two existing helpers with initplan-friendly auth.uid()
create or replace function public.auth_is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from profiles where id = (select auth.uid())), false);
$$;
create or replace function public.auth_member_of_business(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.user_id = (select auth.uid())
      and (m.business_id = b or m.agency_id = (select agency_id from businesses where id = b))
  );
$$;

-- =========================================================================
-- 4. SPLIT THE GENERIC "member_modify for all" POLICIES BY ROLE
-- =========================================================================
do $$
declare t text;
begin
  foreach t in array array['locations','customers','review_platforms','campaigns','reviews','coupons'] loop
    execute format('drop policy if exists %1$I_member_modify on %1$I', t);
    execute format('create policy %1$I_edit_insert on %1$I for insert with check (auth_can_edit_business(business_id))', t);
    execute format('create policy %1$I_edit_update on %1$I for update using (auth_can_edit_business(business_id)) with check (auth_can_edit_business(business_id))', t);
    execute format('create policy %1$I_admin_delete on %1$I for delete using (auth_can_admin_business(business_id))', t);
  end loop;
  -- audit / telemetry tables: read-only for clients
  foreach t in array array['review_requests','ghl_event_log'] loop
    execute format('drop policy if exists %1$I_member_modify on %1$I', t);
  end loop;
end $$;

-- =========================================================================
-- 5. BUSINESSES / AGENCIES / MEMBERSHIPS / GHL policies (initplan + single source of truth)
-- =========================================================================
drop policy if exists memberships_self_select on public.memberships;
create policy memberships_self_select on public.memberships for select
  using (user_id = (select auth.uid()) or auth_is_platform_admin());

drop policy if exists agencies_admin_all on public.agencies;
drop policy if exists agencies_select on public.agencies;
create policy agencies_select on public.agencies for select
  using (auth_is_platform_admin()
         or exists (select 1 from memberships m where m.user_id = (select auth.uid()) and m.agency_id = agencies.id));
create policy agencies_admin_write on public.agencies for insert with check (auth_is_platform_admin());
create policy agencies_admin_update on public.agencies for update using (auth_is_platform_admin());
create policy agencies_admin_delete on public.agencies for delete using (auth_is_platform_admin());

drop policy if exists businesses_owner_update on public.businesses;
drop policy if exists businesses_admin_insert on public.businesses;
drop policy if exists businesses_public_brand_select on public.businesses;
create policy businesses_owner_update on public.businesses for update
  using (auth_can_admin_business(id)) with check (auth_can_admin_business(id));
create policy businesses_admin_insert on public.businesses for insert
  with check (auth_is_platform_admin()
              or (agency_id is not null and exists (
                    select 1 from memberships m
                    where m.user_id = (select auth.uid()) and m.agency_id = businesses.agency_id
                      and m.role = 'agency_admin')));

drop policy if exists ghl_settings_owner_modify on public.ghl_settings;
create policy ghl_settings_admin_insert on public.ghl_settings for insert
  with check (auth_can_admin_business(business_id));
create policy ghl_settings_admin_update on public.ghl_settings for update
  using (auth_can_admin_business(business_id)) with check (auth_can_admin_business(business_id));

drop policy if exists review_platforms_public_select on public.review_platforms;

-- =========================================================================
-- 6. ANON ACCESS: replace views + table policies with one RPC
-- =========================================================================
drop view if exists public.public_business_brand;
drop view if exists public.public_review_platforms;
revoke select on public.businesses, public.review_platforms from anon;

alter table public.businesses add column if not exists is_demo   boolean not null default false;
alter table public.businesses add column if not exists is_active boolean not null default true;
update public.businesses set is_demo = true where slug = 'dani-fish';

create or replace function public.public_business_page(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'business', jsonb_build_object(
      'id', b.id, 'name', b.name, 'slug', b.slug, 'logo_url', b.logo_url,
      'brand_color', b.brand_color, 'welcome_text', b.welcome_text, 'default_lang', b.default_lang
    ),
    'platforms', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'kind', p.kind, 'display_name', p.display_name,
        'icon', p.icon, 'review_url', p.review_url, 'display_order', p.display_order)
        order by p.display_order)
      from review_platforms p where p.business_id = b.id and p.is_active), '[]'::jsonb),
    'coupon', (select jsonb_build_object('terms_text', cs.terms_text, 'approval_mode', cs.approval_mode)
               from coupon_settings cs where cs.business_id = b.id)
  )
  from businesses b
  where b.slug = p_slug and b.is_active;
$$;
-- intentionally callable by anon: this IS the public landing-page read path.
grant execute on function public.public_business_page(text) to anon, authenticated;

-- =========================================================================
-- 7. INTEGRITY: columns, uniqueness, phone normalization
-- =========================================================================
create or replace function public.normalize_phone(p text)
returns text immutable language sql as $$
  select case
    when p is null then null
    when regexp_replace(p, '[^0-9]', '', 'g') = '' then null
    when left(regexp_replace(p, '[^0-9+]', '', 'g'), 1) = '+'
      then '+' || regexp_replace(p, '[^0-9]', '', 'g')
    when left(regexp_replace(p, '[^0-9]', '', 'g'), 2) = '00'
      then '+' || substr(regexp_replace(p, '[^0-9]', '', 'g'), 3)
    when left(regexp_replace(p, '[^0-9]', '', 'g'), 1) = '0'
      then '+972' || substr(regexp_replace(p, '[^0-9]', '', 'g'), 2)
    else '+' || regexp_replace(p, '[^0-9]', '', 'g')
  end;
$$;

alter table public.customers add column if not exists updated_at timestamptz not null default now();
alter table public.customers add column if not exists marketing_consent_at timestamptz;
update public.customers set phone = normalize_phone(phone) where phone is not null;
create unique index if not exists customers_biz_phone_uniq
  on public.customers (business_id, normalize_phone(phone)) where phone is not null;

alter table public.coupons add column if not exists updated_at timestamptz not null default now();
create unique index if not exists coupons_review_id_uniq on public.coupons (review_id) where review_id is not null;

create unique index if not exists memberships_user_scope_uniq
  on public.memberships (user_id, coalesce(business_id, '00000000-0000-0000-0000-000000000000'::uuid),
                         coalesce(agency_id,  '00000000-0000-0000-0000-000000000000'::uuid));

alter table public.reviews add column if not exists customer_message   text;
alter table public.reviews add column if not exists contact_name       text;
alter table public.reviews add column if not exists contact_phone      text;
alter table public.reviews add column if not exists best_time          text;
alter table public.reviews add column if not exists ai_fallback_used   boolean not null default false;
alter table public.reviews add column if not exists ip                 inet;
alter table public.reviews add column if not exists recovery_submits   int not null default 0;
alter table public.reviews add column if not exists click_count        int not null default 0;

create trigger trg_customers_updated_at before update on public.customers for each row execute function set_updated_at();
create trigger trg_coupons_updated_at   before update on public.coupons   for each row execute function set_updated_at();

-- =========================================================================
-- 8. NEW TABLES: coupon_settings, outbox, platform_clicks
-- =========================================================================
create table if not exists public.coupon_settings (
  business_id     uuid primary key references businesses(id) on delete cascade,
  approval_mode   text not null default 'auto' check (approval_mode in ('auto','manual')),
  discount_type   discount_type_t not null default 'custom_text',
  discount_value  text not null default 'הטבה מיוחדת בביקור הבא',
  expiry_days     int not null default 30 check (expiry_days between 1 and 365),
  max_uses        int not null default 1 check (max_uses >= 1),
  terms_text      text not null default 'ההטבה ניתנת על מתן משוב, ללא קשר לפרסום ביקורת. תקפה לביקור הבא בלבד.',
  updated_at      timestamptz not null default now()
);
alter table public.coupon_settings enable row level security;
create policy coupon_settings_select on public.coupon_settings for select
  using (auth_is_platform_admin() or auth_member_of_business(business_id));
create policy coupon_settings_insert on public.coupon_settings for insert
  with check (auth_can_admin_business(business_id));
create policy coupon_settings_update on public.coupon_settings for update
  using (auth_can_admin_business(business_id)) with check (auth_can_admin_business(business_id));
create trigger trg_coupon_settings_updated_at before update on public.coupon_settings
  for each row execute function set_updated_at();
insert into public.coupon_settings (business_id) select id from public.businesses on conflict do nothing;

create table if not exists public.outbox (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses(id) on delete cascade,
  review_id       uuid references reviews(id) on delete set null,
  event           text not null,
  payload         jsonb not null,
  status          text not null default 'pending'
                  check (status in ('pending','processing','sent','failed','skipped')),
  attempts        int not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists outbox_due_idx on public.outbox (status, next_attempt_at) where status in ('pending','processing');
create index if not exists outbox_business_idx on public.outbox (business_id, created_at desc);
alter table public.outbox enable row level security;
create policy outbox_member_select on public.outbox for select
  using (auth_is_platform_admin() or auth_member_of_business(business_id));
create trigger trg_outbox_updated_at before update on public.outbox for each row execute function set_updated_at();

create table if not exists public.platform_clicks (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  review_id   uuid references reviews(id) on delete set null,
  platform    text not null,
  clicked_at  timestamptz not null default now()
);
create index if not exists platform_clicks_biz_idx on public.platform_clicks (business_id, clicked_at desc);
alter table public.platform_clicks enable row level security;
create policy platform_clicks_member_select on public.platform_clicks for select
  using (auth_is_platform_admin() or auth_member_of_business(business_id));

-- =========================================================================
-- 9. FK INDEXES (performance advisor)
-- =========================================================================
create index if not exists campaigns_location_id_idx       on public.campaigns (location_id);
create index if not exists coupons_customer_id_idx         on public.coupons (customer_id);
create index if not exists ghl_event_log_review_id_idx     on public.ghl_event_log (review_id);
create index if not exists review_requests_campaign_id_idx on public.review_requests (campaign_id);
create index if not exists review_requests_location_id_idx on public.review_requests (location_id);
create index if not exists reviews_campaign_id_idx         on public.reviews (campaign_id);
create index if not exists reviews_customer_id_idx         on public.reviews (customer_id);
create index if not exists reviews_location_id_idx         on public.reviews (location_id);
create index if not exists reviews_request_id_idx          on public.reviews (request_id);
create index if not exists reviews_biz_ip_created_idx      on public.reviews (business_id, ip, created_at desc);

-- =========================================================================
-- 10. ATOMIC RPCs (service-role only)
-- =========================================================================

-- 10a. submit_review_tx: customer upsert + review + coupon + outbox in ONE transaction
create or replace function public.submit_review_tx(
  p_business_id uuid, p_campaign_id uuid, p_rating int, p_text text, p_language text,
  p_full_name text, p_phone text, p_email text, p_consent boolean,
  p_ip inet, p_visitor_token text, p_ai jsonb
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_phone text := normalize_phone(p_phone);
  v_email citext := nullif(lower(trim(p_email)), '')::citext;
  v_customer_id uuid;
  v_review_id uuid;
  v_route review_route_t := (p_ai->>'route')::review_route_t;
  v_coupon record;
  v_settings record;
  v_code text;
  v_coupon_status coupon_status_t;
  v_event text;
begin
  -- customer: phone wins, then email
  if v_phone is not null then
    select id into v_customer_id from customers where business_id = p_business_id and normalize_phone(phone) = v_phone limit 1;
  end if;
  if v_customer_id is null and v_email is not null then
    select id into v_customer_id from customers where business_id = p_business_id and email = v_email limit 1;
  end if;
  if v_customer_id is null and (v_phone is not null or v_email is not null) then
    insert into customers (business_id, full_name, phone, email, marketing_consent_at)
    values (p_business_id, nullif(trim(p_full_name),''), v_phone, v_email, case when p_consent then now() end)
    on conflict do nothing
    returning id into v_customer_id;
    if v_customer_id is null and v_phone is not null then
      select id into v_customer_id from customers where business_id = p_business_id and normalize_phone(phone) = v_phone limit 1;
    end if;
  elsif v_customer_id is not null then
    update customers set
      full_name = coalesce(nullif(trim(p_full_name),''), full_name),
      email = coalesce(v_email, email),
      marketing_consent_at = coalesce(marketing_consent_at, case when p_consent then now() end)
    where id = v_customer_id;
  end if;

  insert into reviews (business_id, campaign_id, customer_id, rating, text, language, ip,
                       ai_sentiment, ai_route, ai_confidence, ai_summary, ai_suggested_response,
                       ai_tags, ai_raw, ai_fallback_used, contact_name, contact_phone)
  values (p_business_id, p_campaign_id, v_customer_id, p_rating, nullif(trim(p_text),''), coalesce(p_language,'he'), p_ip,
          (p_ai->>'sentiment')::sentiment_t, v_route, (p_ai->>'confidence')::numeric,
          p_ai->>'summary', p_ai->>'suggested_business_response',
          coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(p_ai->'tags','[]'::jsonb)) x), '{}'),
          p_ai, coalesce((p_ai->>'fallback_used')::boolean, false),
          nullif(trim(p_full_name),''), v_phone)
  returning id into v_review_id;

  -- coupon (for every route — reward is for feedback, not for posting)
  select * into v_settings from coupon_settings where business_id = p_business_id;
  if v_settings is null then
    insert into coupon_settings (business_id) values (p_business_id) returning * into v_settings;
  end if;
  v_code := generate_coupon_code('RFAI');
  v_coupon_status := case when v_settings.approval_mode = 'auto' then 'approved' else 'pending' end;
  insert into coupons (business_id, review_id, customer_id, code, status, discount_type, discount_value,
                       expiration_date, max_uses, approved_at)
  values (p_business_id, v_review_id, v_customer_id, v_code, v_coupon_status,
          v_settings.discount_type, v_settings.discount_value,
          (now() + make_interval(days => v_settings.expiry_days))::date, v_settings.max_uses,
          case when v_coupon_status = 'approved' then now() end)
  returning * into v_coupon;

  -- outbox event for GHL (processed by the function / sweeper)
  v_event := case v_route when 'recovery_flow' then 'negative_review'
                          when 'manual_review' then 'manual_followup_required'
                          else 'positive_review' end;
  insert into outbox (business_id, review_id, event, payload)
  values (p_business_id, v_review_id, v_event, jsonb_build_object(
    'review_id', v_review_id, 'rating', p_rating, 'text', p_text,
    'sentiment', p_ai->>'sentiment', 'route', v_route, 'summary', p_ai->>'summary',
    'customer', jsonb_build_object('full_name', p_full_name, 'phone', v_phone, 'email', v_email,
                                   'consent', p_consent),
    'coupon', jsonb_build_object('code', v_code, 'status', v_coupon_status)
  ));

  return jsonb_build_object(
    'review_id', v_review_id,
    'route', v_route,
    'customer_id', v_customer_id,
    'coupon', jsonb_build_object(
      'status', v_coupon.status,
      'code', case when v_coupon.status in ('approved','sent') then v_coupon.code end,
      'discount_type', v_coupon.discount_type, 'discount_value', v_coupon.discount_value,
      'expiration_date', v_coupon.expiration_date, 'terms_text', v_settings.terms_text
    )
  );
end $$;
revoke execute on function public.submit_review_tx(uuid,uuid,int,text,text,text,text,text,boolean,inet,text,jsonb)
  from public, anon, authenticated;

-- 10b. create_business_with_owner
create or replace function public.create_business_with_owner(
  p_user_id uuid, p_name text, p_slug text, p_color text, p_welcome text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_slug text := p_slug; v_biz_id uuid; v_try int := 0;
begin
  loop
    begin
      insert into businesses (name, slug, brand_color, welcome_text)
      values (p_name, v_slug, coalesce(p_color,'#6d28d9'), p_welcome)
      returning id into v_biz_id;
      exit;
    exception when unique_violation then
      v_try := v_try + 1;
      if v_try > 5 then raise exception 'slug_taken'; end if;
      v_slug := p_slug || '-' || substr(md5(random()::text), 1, 3);
    end;
  end loop;
  insert into memberships (user_id, business_id, role) values (p_user_id, v_biz_id, 'business_owner');
  insert into ghl_settings (business_id, is_enabled) values (v_biz_id, false) on conflict do nothing;
  insert into coupon_settings (business_id) values (v_biz_id) on conflict do nothing;
  return jsonb_build_object('id', v_biz_id, 'name', p_name, 'slug', v_slug);
end $$;
revoke execute on function public.create_business_with_owner(uuid,text,text,text,text) from public, anon, authenticated;

-- 10c. claim_outbox_batch — lock rows so overlapping sweeps never double-send
create or replace function public.claim_outbox_batch(p_limit int default 25)
returns setof public.outbox language sql security definer set search_path = public as $$
  update outbox set status = 'processing', attempts = attempts + 1, updated_at = now()
  where id in (
    select id from outbox
    where status in ('pending','processing') and next_attempt_at <= now()
      and (status = 'pending' or updated_at < now() - interval '10 minutes') -- stale 'processing' = crashed worker
    order by next_attempt_at
    limit p_limit
    for update skip locked
  )
  returning *;
$$;
revoke execute on function public.claim_outbox_batch(int) from public, anon, authenticated;

-- 10d. business_stats — server-side aggregation for the dashboard
create or replace function public.business_stats(p_business_id uuid, p_from timestamptz default now() - interval '30 days', p_to timestamptz default now())
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not (auth_is_platform_admin() or auth_member_of_business(p_business_id)) then null else
  jsonb_build_object(
    'visits',        (select count(*) from review_requests where business_id = p_business_id and created_at between p_from and p_to),
    'reviews',       (select count(*) from reviews where business_id = p_business_id and created_at between p_from and p_to),
    'avg_rating',    (select round(avg(rating)::numeric, 1) from reviews where business_id = p_business_id and created_at between p_from and p_to),
    'positive',      (select count(*) from reviews where business_id = p_business_id and ai_route = 'positive_flow' and created_at between p_from and p_to),
    'negative',      (select count(*) from reviews where business_id = p_business_id and ai_route = 'recovery_flow' and created_at between p_from and p_to),
    'manual',        (select count(*) from reviews where business_id = p_business_id and ai_route = 'manual_review' and created_at between p_from and p_to),
    'open_recovery', (select count(*) from reviews where business_id = p_business_id and ai_route in ('recovery_flow','manual_review') and status in ('new','in_progress','contacted')),
    'clicks',        (select count(*) from platform_clicks where business_id = p_business_id and clicked_at between p_from and p_to),
    'clicks_by_platform', coalesce((select jsonb_object_agg(platform, c) from (select platform, count(*) c from platform_clicks where business_id = p_business_id and clicked_at between p_from and p_to group by platform) s), '{}'::jsonb),
    'coupons_issued',  (select count(*) from coupons where business_id = p_business_id and created_at between p_from and p_to),
    'coupons_pending', (select count(*) from coupons where business_id = p_business_id and status = 'pending'),
    'coupons_redeemed',(select count(*) from coupons where business_id = p_business_id and status = 'redeemed' and created_at between p_from and p_to),
    'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'reviews', r, 'positive', p, 'negative', n) order by d)
               from (select date_trunc('day', created_at)::date d, count(*) r,
                            count(*) filter (where ai_route='positive_flow') p,
                            count(*) filter (where ai_route='recovery_flow') n
                     from reviews where business_id = p_business_id and created_at between p_from and p_to
                     group by 1) t), '[]'::jsonb),
    'sentiment', jsonb_build_object(
      'positive', (select count(*) from reviews where business_id = p_business_id and ai_sentiment='positive' and created_at between p_from and p_to),
      'neutral',  (select count(*) from reviews where business_id = p_business_id and ai_sentiment='neutral'  and created_at between p_from and p_to),
      'negative', (select count(*) from reviews where business_id = p_business_id and ai_sentiment='negative' and created_at between p_from and p_to))
  ) end;
$$;
-- client RPC on purpose (gated inside by membership)
grant execute on function public.business_stats(uuid,timestamptz,timestamptz) to authenticated;

-- Service role must keep EXECUTE after the PUBLIC revoke (Netlify functions use it).
grant execute on function public.submit_review_tx(uuid,uuid,int,text,text,text,text,text,boolean,inet,text,jsonb) to service_role;
grant execute on function public.create_business_with_owner(uuid,text,text,text,text) to service_role;
grant execute on function public.claim_outbox_batch(int) to service_role;
grant execute on function public.business_stats(uuid,timestamptz,timestamptz) to service_role;
grant execute on function public.public_business_page(text) to service_role;

-- =========================================================================
-- 11. ENUM additions (usable from the next transaction onward)
-- =========================================================================
alter type ghl_event_t add value if not exists 'platform_clicked';
alter type ghl_event_t add value if not exists 'auth_email';
alter type ghl_event_t add value if not exists 'system_alert';

-- =========================================================================
-- ROLLBACK (manual):
--   drop function submit_review_tx, create_business_with_owner, claim_outbox_batch,
--     business_stats, public_business_page, normalize_phone, auth_business_role,
--     auth_can_edit_business, auth_can_admin_business, ghl_settings_sync_flags;
--   drop table platform_clicks, outbox, coupon_settings;
--   drop index customers_biz_phone_uniq, coupons_review_id_uniq, memberships_user_scope_uniq, reviews_biz_ip_created_idx;
--   alter table reviews drop column customer_message, contact_name, contact_phone, best_time,
--     ai_fallback_used, ip, recovery_submits, click_count;
--   alter table businesses drop column is_demo, is_active;
--   alter table ghl_settings drop column has_api_key;
--   grant select, insert, update on ghl_settings to authenticated; grant update on profiles to authenticated;
--   re-run 0002_rls.sql sections for the dropped policies/views.
-- =========================================================================
