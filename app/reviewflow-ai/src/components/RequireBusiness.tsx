import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useActiveBusiness, type ActiveBusiness } from "@/lib/businessContext";
import { PageState } from "@/components/ui";

/** Renders children only when an active business is resolved; shows skeleton / CTA otherwise. */
export default function RequireBusiness({ children }: { children: (b: ActiveBusiness) => ReactNode }) {
  const { business, loading } = useActiveBusiness();
  if (loading && !business) return <PageState kind="loading" />;
  if (!business) {
    return (
      <PageState kind="empty" title="עדיין אין לכם עסק במערכת" text="בואו נקים את הראשון — זה לוקח דקה."
        action={<Link to="/app/new" className="btn-primary mt-2">+ יצירת עסק חדש</Link>} />
    );
  }
  return <>{children(business)}</>;
}
