-- Security hardening (applied after RLS). Pins function search_path, removes a
-- permissive WITH CHECK on ghl_settings, and revokes RPC access to the trigger fn.

alter function public.generate_coupon_code(text) set search_path = public;
alter function public.set_updated_at() set search_path = public;
alter function public.auth_is_platform_admin() set search_path = public;
alter function public.auth_member_of_business(uuid) set search_path = public;

revoke execute on function public.handle_new_user() from anon, authenticated;

drop policy if exists ghl_settings_owner_modify on ghl_settings;
create policy ghl_settings_owner_modify on ghl_settings for all
  using (auth_is_platform_admin()
         or exists (select 1 from memberships m
                    where m.user_id = auth.uid()
                      and m.business_id = ghl_settings.business_id
                      and m.role in ('business_owner','agency_admin')))
  with check (auth_is_platform_admin()
         or exists (select 1 from memberships m
                    where m.user_id = auth.uid()
                      and m.business_id = ghl_settings.business_id
                      and m.role in ('business_owner','agency_admin')));
