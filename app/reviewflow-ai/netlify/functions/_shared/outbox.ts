// Outbox: durable delivery of integration events.
// Writers insert rows (usually inside submit_review_tx). `deliverNow` tries once
// inline with a short budget so the common path is fast; `process-outbox`
// (scheduled) retries failures with backoff and locks rows via claim_outbox_batch.

import { getServiceSupabase } from "./supabase";
import { dispatchEvent, loadSettings, type GhlEvent } from "./ghlService";

export interface OutboxRow {
  id: string; business_id: string; review_id: string | null;
  event: GhlEvent; payload: any; status: string; attempts: number;
}

const MAX_ATTEMPTS = 5;
const backoffMinutes = (attempt: number) => [1, 5, 15, 60, 180][Math.min(attempt, 4)];

export async function enqueue(args: { business_id: string; review_id?: string | null; event: GhlEvent; payload: Record<string, unknown> }): Promise<string | null> {
  const sb = getServiceSupabase();
  const { data } = await sb.from("outbox").insert({
    business_id: args.business_id, review_id: args.review_id ?? null, event: args.event, payload: args.payload,
  }).select("id").single();
  return data?.id ?? null;
}

async function businessName(business_id: string): Promise<string | undefined> {
  const sb = getServiceSupabase();
  const { data } = await sb.from("businesses").select("name").eq("id", business_id).maybeSingle();
  return data?.name;
}

/** Attempt delivery of one row and persist the outcome. Never throws. */
export async function deliver(row: OutboxRow): Promise<"sent" | "skipped" | "retry" | "failed"> {
  const sb = getServiceSupabase();
  try {
    const settings = await loadSettings(row.business_id);
    const result = await dispatchEvent(settings, row.event, row.payload, {
      event_id: row.id, review_id: row.review_id, business_name: await businessName(row.business_id),
    });
    await sb.from("outbox").update({ status: result, last_error: null }).eq("id", row.id);
    return result;
  } catch (e: any) {
    const attempts = (row.attempts ?? 0) + 1;
    const failed = attempts >= MAX_ATTEMPTS;
    await sb.from("outbox").update({
      status: failed ? "failed" : "pending",
      attempts,
      last_error: String(e?.message ?? e).slice(0, 500),
      next_attempt_at: new Date(Date.now() + backoffMinutes(attempts) * 60_000).toISOString(),
    }).eq("id", row.id);
    return failed ? "failed" : "retry";
  }
}

/** Inline best-effort delivery for a freshly written row, bounded in time. */
export async function deliverNow(outbox_id: string | null | undefined, budgetMs = 3000): Promise<void> {
  if (!outbox_id) return;
  const sb = getServiceSupabase();
  const { data } = await sb.from("outbox").select("*").eq("id", outbox_id).maybeSingle();
  if (!data || data.status !== "pending") return;
  // mark processing so the sweeper doesn't race us
  await sb.from("outbox").update({ status: "processing", attempts: (data.attempts ?? 0) + 1 }).eq("id", outbox_id);
  await Promise.race([
    deliver({ ...(data as OutboxRow), attempts: data.attempts ?? 0 }),
    new Promise<void>((resolve) => setTimeout(resolve, budgetMs)),
  ]);
}
