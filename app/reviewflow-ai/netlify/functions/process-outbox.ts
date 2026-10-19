// Scheduled sweeper: retries undelivered integration events with backoff.
// Rows are locked via claim_outbox_batch (FOR UPDATE SKIP LOCKED) so overlapping
// runs never double-send. Also emits a daily "failed events" alert.
import type { Handler } from "@netlify/functions";
import { schedule } from "@netlify/functions";
import { getServiceSupabase } from "./_shared/supabase";
import { deliver, enqueue, type OutboxRow } from "./_shared/outbox";

const BATCH = 25;

const run: Handler = async () => {
  const sb = getServiceSupabase();
  const { data: rows, error } = await sb.rpc("claim_outbox_batch", { p_limit: BATCH });
  if (error) { console.error("claim_outbox_batch", error); return { statusCode: 500 }; }

  const summary = { sent: 0, skipped: 0, retry: 0, failed: 0 };
  for (const row of (rows ?? []) as OutboxRow[]) {
    // claim_outbox_batch already incremented attempts; deliver() reads the pre-claim count
    const r = await deliver({ ...row, attempts: Math.max(0, (row.attempts ?? 1) - 1) });
    summary[r] += 1;
  }

  // Daily alert at ~06:00 UTC: how many events are stuck in `failed` per business.
  const now = new Date();
  if (now.getUTCHours() === 6 && now.getUTCMinutes() < 10) {
    const { data: failed } = await sb.from("outbox").select("business_id").eq("status", "failed")
      .gte("updated_at", new Date(Date.now() - 86_400_000).toISOString());
    const perBiz = new Map<string, number>();
    (failed ?? []).forEach((f: any) => perBiz.set(f.business_id, (perBiz.get(f.business_id) ?? 0) + 1));
    for (const [business_id, count] of perBiz) {
      await enqueue({ business_id, event: "system_alert", payload: { kind: "outbox_failed", count, since: "24h" } });
    }
  }

  console.log("process-outbox", summary);
  return { statusCode: 200, body: JSON.stringify(summary) };
};

export const handler = schedule("*/10 * * * *", run);
