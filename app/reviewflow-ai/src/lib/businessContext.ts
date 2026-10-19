import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface ActiveBusiness {
  id: string;
  name: string;
  slug: string;
  role: string;
}

const ACTIVE_KEY = "rf:activeBusinessId";

export function getActiveBusinessId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}
export function setActiveBusinessId(id: string) {
  localStorage.setItem(ACTIVE_KEY, id);
}

// Lists every business the signed-in user is a member of.
export function useMyBusinesses() {
  const [list, setList] = useState<ActiveBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setList([]); setLoading(false); return; }
    const { data } = await supabase
      .from("memberships")
      .select("role, businesses(id, name, slug)")
      .eq("user_id", session.user.id)
      .not("business_id", "is", null);
    const rows: ActiveBusiness[] = (data ?? [])
      .filter((r: any) => r.businesses)
      .map((r: any) => ({ id: r.businesses.id, name: r.businesses.name, slug: r.businesses.slug, role: r.role }));
    setList(rows);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { businesses: list, loading, refresh };
}

// Returns the currently-active business (from localStorage, falling back to first).
// Platform admins can activate a business they are not a member of; in that case
// we resolve it directly from the businesses table.
export function useActiveBusiness() {
  const { businesses, loading, refresh } = useMyBusinesses();
  const [activeId, setActiveId] = useState<string | null>(getActiveBusinessId());
  const [resolved, setResolved] = useState<ActiveBusiness | null>(null);

  useEffect(() => {
    if (loading) return;
    const stored = getActiveBusinessId();
    if (stored && businesses.some((b) => b.id === stored)) {
      setActiveId(stored);
    } else if (stored) {
      // Stored id is not among memberships: keep it only if the user can still
      // resolve it (platform admin); otherwise fall back to the first business.
      setActiveId(stored);
    } else if (businesses[0]) {
      setActiveBusinessId(businesses[0].id);
      setActiveId(businesses[0].id);
    } else {
      setActiveId(null);
    }
  }, [loading, businesses]);

  // If the active id isn't among memberships (platform admin case), fetch it.
  // If it cannot be resolved (stale id, membership removed), fall back.
  useEffect(() => {
    const inList = businesses.find((b) => b.id === activeId);
    if (!activeId || inList) { setResolved(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("businesses").select("id, name, slug").eq("id", activeId).maybeSingle();
      if (cancelled) return;
      if (data) {
        setResolved({ id: data.id, name: data.name, slug: data.slug, role: "platform_admin" });
      } else if (businesses[0]) {
        setActiveBusinessId(businesses[0].id);
        setActiveId(businesses[0].id);
        setResolved(null);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
        setActiveId(null);
        setResolved(null);
      }
    })();
    return () => { cancelled = true; };
  }, [activeId, businesses]);

  const business = businesses.find((b) => b.id === activeId) ?? resolved;

  const select = useCallback((id: string) => {
    setActiveBusinessId(id);
    setActiveId(id);
  }, []);

  return { business, businesses, loading, select, refresh };
}
