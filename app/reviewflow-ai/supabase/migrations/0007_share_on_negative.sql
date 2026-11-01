-- ReviewFlow AI — 0007: per-business switch for showing public review links after a negative review.
-- Default FALSE (links hidden on the recovery page). Product decision by the platform owner;
-- note that hiding links selectively by sentiment is "review gating" under Google's policy.

alter table public.businesses add column if not exists share_on_negative boolean not null default false;

create or replace function public.public_business_page(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'business', jsonb_build_object(
      'id', b.id, 'name', b.name, 'slug', b.slug, 'logo_url', b.logo_url,
      'brand_color', b.brand_color, 'welcome_text', b.welcome_text, 'default_lang', b.default_lang,
      'share_on_negative', b.share_on_negative),
    'platforms', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.id, 'kind', p.kind, 'display_name', p.display_name,
        'icon', p.icon, 'review_url', p.review_url, 'display_order', p.display_order) order by p.display_order)
      from review_platforms p where p.business_id = b.id and p.is_active), '[]'::jsonb),
    'coupon', (select jsonb_build_object('terms_text', cs.terms_text, 'approval_mode', cs.approval_mode)
               from coupon_settings cs where cs.business_id = b.id))
  from businesses b where b.slug = p_slug and b.is_active;
$$;
