-- ReviewFlow AI — 0006: logo storage, team invitations, campaign/location polish.
-- Additive only (safe to apply through any tool).

-- =========================================================================
-- 1. Logo storage bucket (public read, admins of the business write to their folder)
-- =========================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png','image/jpeg','image/webp','image/svg+xml'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/png','image/jpeg','image/webp','image/svg+xml'];

-- object path convention: {business_id}/logo.{ext}
create policy "logos_public_read" on storage.objects for select
  using (bucket_id = 'logos');
create policy "logos_admin_insert" on storage.objects for insert
  with check (bucket_id = 'logos' and auth_can_admin_business((storage.foldername(name))[1]::uuid));
create policy "logos_admin_update" on storage.objects for update
  using (bucket_id = 'logos' and auth_can_admin_business((storage.foldername(name))[1]::uuid));
create policy "logos_admin_delete" on storage.objects for delete
  using (bucket_id = 'logos' and auth_can_admin_business((storage.foldername(name))[1]::uuid));

-- =========================================================================
-- 2. Team invitations
-- =========================================================================
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  email       citext not null,
  role        platform_role not null default 'business_staff' check (role in ('business_owner','business_staff')),
  token       text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by  uuid references profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at  timestamptz not null default now() + interval '14 days',
  created_at  timestamptz not null default now()
);
create index if not exists invitations_business_idx on public.invitations (business_id, created_at desc);
alter table public.invitations enable row level security;
create policy invitations_admin_select on public.invitations for select
  using (auth_can_admin_business(business_id));
create policy invitations_admin_insert on public.invitations for insert
  with check (auth_can_admin_business(business_id) and invited_by = (select auth.uid()));
create policy invitations_admin_delete on public.invitations for delete
  using (auth_can_admin_business(business_id));

-- Members of a business can see who else is on the team (name/email), admins can remove.
create policy memberships_team_select on public.memberships for select
  using (business_id is not null and auth_member_of_business(business_id));
create policy memberships_admin_delete on public.memberships for delete
  using (business_id is not null and auth_can_admin_business(business_id) and user_id <> (select auth.uid()));
create policy profiles_team_select on public.profiles for select
  using (exists (select 1 from memberships m where m.user_id = profiles.id and m.business_id is not null and auth_member_of_business(m.business_id)));

-- Accept an invite: called by the service role from accept-invite.ts after verifying the JWT.
create or replace function public.accept_invitation(p_token text, p_user_id uuid, p_email text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v record;
begin
  select * into v from invitations where token = p_token and accepted_at is null and expires_at > now();
  if v is null then return jsonb_build_object('ok', false, 'error', 'INVALID_OR_EXPIRED'); end if;
  if lower(v.email::text) <> lower(p_email) then return jsonb_build_object('ok', false, 'error', 'EMAIL_MISMATCH'); end if;
  insert into memberships (user_id, business_id, role) values (p_user_id, v.business_id, v.role)
    on conflict do nothing;
  update invitations set accepted_at = now() where id = v.id;
  return jsonb_build_object('ok', true, 'business_id', v.business_id);
end $$;
revoke execute on function public.accept_invitation(text, uuid, text) from public, anon, authenticated;
grant execute on function public.accept_invitation(text, uuid, text) to service_role;

-- =========================================================================
-- 3. Campaign / location polish
-- =========================================================================
alter table public.campaigns add column if not exists updated_at timestamptz not null default now();
create or replace trigger trg_campaigns_updated_at before update on public.campaigns for each row execute function set_updated_at();
create index if not exists campaigns_slug_idx on public.campaigns (business_id, slug);

-- =========================================================================
-- 4. Coupon expiry helper (called by the scheduled function)
-- =========================================================================
create or replace function public.expire_coupons()
returns int language sql security definer set search_path = public as $$
  with u as (
    update coupons set status = 'expired'
    where status in ('approved','sent') and expiration_date is not null and expiration_date < current_date
    returning 1)
  select count(*)::int from u;
$$;
revoke execute on function public.expire_coupons() from public, anon, authenticated;
grant execute on function public.expire_coupons() to service_role;
