import type { ReviewPlatform } from "@/lib/types";
import { beaconPlatformClick } from "@/lib/publicApi";

const ICONS: Record<string, string> = {
  google: "G", facebook: "f", easy: "E", tripadvisor: "T", zaprest: "Z", trustpilot: "★", dapeizahav: "ד", custom: "↗",
};

/**
 * Public review links. Always shown on the thanks page (positive / neutral); on the
 * recovery page only when the business enabled `share_on_negative`. Same markup wherever
 * it renders. Plain anchors (not window.open after await) so iOS Safari never blocks navigation.
 */
export default function SharePlatforms({ platforms, reviewId, loading }: { platforms: ReviewPlatform[]; reviewId: string | null; loading?: boolean }) {
  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-3" aria-busy="true">
        <div className="h-5 w-40 mx-auto rounded bg-slate-100 animate-pulse" />
        {[0, 1].map((i) => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}
      </section>
    );
  }
  if (!platforms.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-3" aria-labelledby="share-h">
      <h2 id="share-h" className="text-base font-bold text-center">נשמח אם תשתפו את החוויה גם ב:</h2>
      <div className="grid grid-cols-1 gap-2">
        {platforms.map((p) => (
          <a
            key={p.id}
            href={p.review_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { if (reviewId) beaconPlatformClick(reviewId, p.kind); }}
            className="btn-ghost justify-between text-base py-3 min-h-[48px]"
          >
            <span aria-hidden="true" className="h-8 w-8 rounded-lg bg-slate-100 grid place-items-center font-bold text-slate-700">{p.icon || ICONS[p.kind] || "↗"}</span>
            <span className="flex-1 text-center">{p.display_name}</span>
            <span aria-hidden="true" className="text-slate-400">↗</span>
          </a>
        ))}
      </div>
      <p className="text-[11px] text-slate-400 text-center">השיתוף הוא לבחירתכם ואינו תנאי לקבלת ההטבה.</p>
    </section>
  );
}
