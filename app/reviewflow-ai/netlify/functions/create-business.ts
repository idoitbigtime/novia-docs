import type { Handler } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { ok, fail, parseBody, preflight, bearer } from "./_shared/http";
import { clampText, slugify } from "./_shared/validators";

interface Body { name?: string; slug?: string; brand_color?: string; welcome_text?: string }

const MAX_BUSINESSES_PER_USER = 5;

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);

  const token = bearer(event.headers as Record<string, string | undefined>);
  if (!token) return fail("UNAUTHORIZED", 401);

  const sb = getServiceSupabase();
  const { data: userData, error: userErr } = await sb.auth.getUser(token);
  if (userErr || !userData?.user) return fail("UNAUTHORIZED", 401);
  const user = userData.user;

  const b = parseBody<Body>(event);
  const name = clampText(b.name, 80);
  if (!name || name.length < 2) return fail("INVALID_INPUT", 400, { field: "name" });
  const color = typeof b.brand_color === "string" && /^#[0-9a-fA-F]{6}$/.test(b.brand_color) ? b.brand_color : "#6d28d9";
  const welcome = clampText(b.welcome_text, 300);
  let slug = b.slug ? slugify(b.slug) : slugify(name);
  if (!slug) slug = `biz-${Math.random().toString(36).slice(2, 7)}`;

  // quota (platform admins are exempt)
  const { data: prof } = await sb.from("profiles").select("is_platform_admin").eq("id", user.id).maybeSingle();
  if (!prof?.is_platform_admin) {
    const { count } = await sb.from("memberships").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("role", "business_owner");
    if ((count ?? 0) >= MAX_BUSINESSES_PER_USER) return fail("QUOTA_EXCEEDED", 403);
  }

  // make sure a profile row exists (defensive: trigger normally does this)
  await sb.from("profiles").upsert(
    { id: user.id, email: user.email ?? `${user.id}@no-email.local`, full_name: user.user_metadata?.full_name ?? "" },
    { onConflict: "id", ignoreDuplicates: true },
  );

  const { data, error } = await sb.rpc("create_business_with_owner", {
    p_user_id: user.id, p_name: name, p_slug: slug, p_color: color, p_welcome: welcome,
  });
  if (error) {
    if (String(error.message).includes("slug_taken")) return fail("SLUG_TAKEN", 409);
    console.error("create_business_with_owner failed", error);
    return fail("INTERNAL", 500);
  }
  return ok({ business: data });
};
