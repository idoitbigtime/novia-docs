-- ReviewFlow AI — demo seed (safe to re-run; uses ON CONFLICT DO NOTHING)

insert into businesses (id, name, slug, brand_color, welcome_text, default_lang)
values
  ('11111111-1111-1111-1111-111111111111',
   'מסעדת הדגים של דני',
   'dani-fish',
   '#0ea5e9',
   'תודה שאכלת אצלנו! נשמח לדעת מה דעתך 🐟',
   'he')
on conflict (id) do nothing;

insert into review_platforms (business_id, kind, display_name, icon, review_url, display_order)
values
  ('11111111-1111-1111-1111-111111111111', 'google', 'Google',
   '⭐', 'https://search.google.com/local/writereview?placeid=DEMO', 1),
  ('11111111-1111-1111-1111-111111111111', 'facebook', 'Facebook',
   '👍', 'https://www.facebook.com/DEMO/reviews', 2),
  ('11111111-1111-1111-1111-111111111111', 'easy', 'Easy',
   '🍽️', 'https://www.easy.co.il/DEMO', 3)
on conflict do nothing;

insert into ghl_settings (business_id, is_enabled)
values ('11111111-1111-1111-1111-111111111111', false)
on conflict (business_id) do nothing;
