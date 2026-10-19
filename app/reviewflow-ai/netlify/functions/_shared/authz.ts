// Authorization helpers for dashboard-side functions (JWT → user → business role).
import { getServiceSupabase } from "./supabase";
import { bearer } from "./http";

export interface AuthedUser { id: string; email: string | null; is_platform_admin: boolean }

export async function requireUser(headers: Record<string, string | undefined>): Promise<AuthedUser | null> {
  const token = bearer(headers);
  if (!token) return null;
  const sb = getServiceSupabase();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) return null;
  const { data: prof } = await sb.from("profiles").select("is_platform_admin").eq("id", data.user.id).maybeSingle();
  return { id: data.user.id, email: data.user.email ?? null, is_platform_admin: !!prof?.is_platform_admin };
}

/** Editors: owner, staff, agency admin (direct or through the business's agency), platform admin. */
export async function canEditBusiness(user: AuthedUser, business_id: string, adminOnly = false): Promise<boolean> {
  if (user.is_platform_admin) return true;
  const sb = getServiceSupabase();
  const { data: biz } = await sb.from("businesses").select("agency_id").eq("id", business_id).maybeSingle();
  const roles = adminOnly ? ["business_owner", "agency_admin"] : ["business_owner", "business_staff", "agency_admin"];
  const q = sb.from("memberships").select("role").eq("user_id", user.id).in("role", roles);
  const { data } = biz?.agency_id
    ? await q.or(`business_id.eq.${business_id},agency_id.eq.${biz.agency_id}`)
    : await q.eq("business_id", business_id);
  return (data?.length ?? 0) > 0;
}
