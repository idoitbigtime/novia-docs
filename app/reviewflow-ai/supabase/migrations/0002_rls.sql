-- ReviewFlow AI — Row-Level Security
-- Rule of thumb: clients only see data for businesses they are a member of.
-- Platform admins see everything. Service role bypasses RLS (used by Netlify functions
-- that need to write on behalf of anonymous customers).

-- =========================================================================
-- HELPERS
-- =========================================================================
create or replace function auth_is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_platform_admin from profiles where id = auth.uid()), false);
$$;

create or replace function auth_member_of_business(b uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid()
      and (m.business_id = b
           or m.agency_id = (select agency_id from businesses where id = b))
  );
$$;

-- =========================================================================
-- ENABLE RLS
-- =========================================================================
alter table agencies          enable row level security;
alter table businesses        enable row level security;
alter table locations         enable row level security;
alter table profiles          enable row level security;
alter table memberships       enable row level security;
alter table customers         enable row level security;
alter table review_platforms  enable row level security;
alter table campaigns         enable row level security;
alter table review_requests   enable row level security;
alter table reviews           enable row level security;
alter table coupons           enable row level security;
alter table ghl_settings      enable row level security;
alter table ghl_event_log     enable row level security;

-- =========================================================================
-- PROFILES — a user can read their own row
-- =========================================================================
create policy profiles_self_select on profiles for select
  using (id = auth.uid() or auth_is_platform_admin());
create policy profiles_self_update on profiles for update
  using (id = auth.uid());

-- =========================================================================
-- MEMBERSHIPS — a user sees their own memberships
-- =========================================================================
create policy memberships_self_select on memberships for select
  using (user_id = auth.uid() or auth_is_platform_admin());

-- =========================================================================
-- AGENCIES — platform admins; members can read their agency
-- =========================================================================
create policy agencies_select on agencies for select
  using (
    auth_is_platform_admin()
    or exists (select 1 from memberships m where m.user_id = auth.uid() and m.agency_id = agencies.id)
  );
create policy agencies_admin_all on agencies for all
  using (auth_is_platform_admin())
  with check (auth_is_platform_admin());

-- =========================================================================
-- BUSINESSES — members can read; platform admins manage
-- =========================================================================
create policy businesses_select on businesses for select
  using (auth_is_platform_admin() or auth_member_of_business(id));
create policy businesses_owner_update on businesses for update
  using (
    auth_is_platform_admin()
    or exists (select 1 from memberships m
               where m.user_id = auth.uid()
                 and m.business_id = businesses.id
                 and m.role in ('business_owner','agency_admin'))
  );
create policy businesses_admin_insert on businesses for insert
  with check (auth_is_platform_admin() or exists (
    select 1 from memberships m where m.user_id = auth.uid() and m.role in ('agency_admin','platform_admin')
  ));
create policy businesses_admin_delete on businesses for delete
  using (auth_is_platform_admin());

-- =========================================================================
-- LOCATIONS, CUSTOMERS, REVIEW_PLATFORMS, CAMPAIGNS, REVIEW_REQUESTS,
-- REVIEWS, COUPONS, GHL_SETTINGS, GHL_EVENT_LOG — scoped by business_id
-- =========================================================================
-- generic helper-driven policies
do $$
declare
  t text;
  per_table_tables text[] := array[
    'locations','customers','review_platforms','campaigns',
    'review_requests','reviews','coupons','ghl_event_log'
  ];
begin
  foreach t in array per_table_tables loop
    execute format($f$
      create policy %1$I_member_select on %1$I for select
        using (auth_is_platform_admin() or auth_member_of_business(business_id));
    $f$, t);

    execute format($f$
      create policy %1$I_member_modify on %1$I for all
        using (auth_is_platform_admin() or auth_member_of_business(business_id))
        with check (auth_is_platform_admin() or auth_member_of_business(business_id));
    $f$, t);
  end loop;
end;
$$;

-- ghl_settings has business_id as PK
create policy ghl_settings_member_select on ghl_settings for select
  using (auth_is_platform_admin() or auth_member_of_business(business_id));
create policy ghl_settings_owner_modify on ghl_settings for all
  using (auth_is_platform_admin()
         or exists (select 1 from memberships m
                    where m.user_id = auth.uid()
                      and m.business_id = ghl_settings.business_id
                      and m.role in ('business_owner','agency_admin')))
  with check (true);

-- =========================================================================
-- PUBLIC READ FOR CUSTOMER REVIEW LANDING PAGE
-- The /r/{slug} page is anonymous and needs the business brand + active platforms.
-- Expose ONLY safe public columns through these dedicated views.
-- =========================================================================
create or replace view public_business_brand
  with (security_invoker = true) as
  select id, name, slug, logo_url, brand_color, welcome_text, default_lang
  from businesses;

create or replace view public_review_platforms
  with (security_invoker = true) as
  select id, business_id, kind, display_name, icon, review_url, display_order
  from review_platforms
  where is_active = true;

-- Make these visible to anon (the SELECT policies on the underlying tables still gate row access,
-- so we add a narrow public-select policy here):
create policy businesses_public_brand_select on businesses for select
  to anon
  using (true);

create policy review_platforms_public_select on review_platforms for select
  to anon
  using (is_active = true);

grant select on public_business_brand to anon, authenticated;
grant select on public_review_platforms to anon, authenticated;
