import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { ok, bad, parseBody } from "./_shared/http";

interface Body {
  name: string;
  slug?: string;
  brand_color?: string;
  welcome_text?: string;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9֐-׿]+/g, "-") // keep latin, digits, hebrew
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return bad("method not allowed", 405);

  // Authenticate the caller via their Supabase access token.
  const auth = event.headers["authorization"] || event.headers["Authorization"];
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return bad("unauthorized", 401);

  const sb = getServiceSupabase();
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  if (userErr || !userData?.user) return bad("unauthorized", 401);
  const user = userData.user;

  const b = parseBody<Body>(event);
  if (!b.name || b.name.trim().length < 2) return bad("שם עסק לא תקין");

  // Build a unique slug.
  let base = b.slug ? slugify(b.slug) : slugify(b.name);
  if (!base) base = "biz";
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await sb.from("businesses").select("id").eq("slug", slug).maybeSingle();
    if (!exists) break;
    slug = `${base}-${Math.random().toString(36).slice(2, 5)}`;
  }

  // Ensure the caller has a profile row (defensive — trigger normally handles this).
  await sb.from("profiles").upsert(
    { id: user.id, email: user.email, full_name: user.user_metadata?.full_name ?? "" },
    { onConflict: "id" },
  );

  // Create the business.
  const { data: biz, error: bizErr } = await sb
    .from("businesses")
    .insert({
      name: b.name.trim(),
      slug,
      brand_color: b.brand_color || "#6d28d9",
      welcome_text: b.welcome_text || null,
    })
    .select("id, name, slug")
    .single();
  if (bizErr || !biz) return bad(bizErr?.message ?? "יצירת העסק נכשלה", 500);

  // Link the caller as owner + default GHL settings row.
  const { error: memErr } = await sb.from("memberships").insert({
    user_id: user.id,
    business_id: biz.id,
    role: "business_owner",
  });
  if (memErr) return bad(memErr.message, 500);

  await sb.from("ghl_settings").upsert({ business_id: biz.id, is_enabled: false }, { onConflict: "business_id" });

  return ok({ business: biz });
};
