import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface ActiveBusiness {
  id: string;
  name: string;
  slug: string;
  role: string;
}

// Returns the first business the current user is a member of.
// Multi-business switcher can be added later; this is enough for MVP.
export function useActiveBusiness() {
  const [biz, setBiz] = useState<ActiveBusiness | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data } = await supabase
        .from("memberships")
        .select("role, business_id, businesses(id, name, slug)")
        .eq("user_id", session.user.id)
        .not("business_id", "is", null)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (data?.businesses) {
        const b = data.businesses as any;
        setBiz({ id: b.id, name: b.name, slug: b.slug, role: data.role });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { business: biz, loading };
}
