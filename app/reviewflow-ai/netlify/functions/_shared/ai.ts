// AI classification for customer feedback.
// The LLM ADVISES; the ordered rules in `applyRoutingRules` DECIDE.
// Works without an OpenAI key (heuristic fallback) so the product never blocks on AI.

import OpenAI from "openai";

export type Sentiment = "positive" | "neutral" | "negative";
export type Route = "positive_flow" | "recovery_flow" | "manual_review";

export interface AIResult {
  sentiment: Sentiment;
  route: Route;
  confidence: number;
  summary: string;
  suggested_business_response: string;
  tags: string[];
  severe_complaint: boolean;
  fallback_used: boolean;
}

const SENTIMENTS: Sentiment[] = ["positive", "neutral", "negative"];
const ROUTES: Route[] = ["positive_flow", "recovery_flow", "manual_review"];

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  // Netlify sync functions have a 10s budget; keep the model call short and never retry.
  client = new OpenAI({ apiKey, timeout: 3000, maxRetries: 0 });
  return client;
}

const SYSTEM = `You analyse customer feedback for a local business (Hebrew-first; may be any language).
Return STRICT JSON:
{
  "sentiment": "positive" | "neutral" | "negative",
  "route": "positive_flow" | "recovery_flow" | "manual_review",
  "confidence": 0.0-1.0,
  "summary": "<= 1 sentence, same language as input",
  "suggested_business_response": "polite reply the owner could send, same language",
  "tags": ["lowercase", "short", "keywords"],
  "severe_complaint": true | false
}
severe_complaint = anger, safety/hygiene issue, rudeness, refund demand, threat to post publicly.
route guidance: rating>=4 and no severe complaint -> positive_flow; rating<=3 -> recovery_flow;
severe complaint -> recovery_flow even with 5 stars; ambiguous/contradictory/abusive -> manual_review.
Never invent facts. No PII.`;

interface Input { rating: number; text: string | null; language?: string }

function clamp01(n: unknown): number {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0;
}

/** Ordered, deterministic rules. LLM output only matters inside the gaps. */
export function applyRoutingRules(input: Input, llm: Partial<AIResult> | null, fallbackUsed: boolean): Route {
  const severe = !!llm?.severe_complaint;
  const llmRoute = ROUTES.includes(llm?.route as Route) ? (llm!.route as Route) : null;
  const conf = clamp01(llm?.confidence);

  if (input.rating <= 3) return "recovery_flow";                       // 1
  if (severe) return "recovery_flow";                                  // 2
  if (llmRoute === "recovery_flow" && conf >= 0.6) return "recovery_flow"; // LLM strongly flags text
  if (!fallbackUsed && llmRoute === "manual_review" && conf >= 0.6) return "manual_review"; // 4
  return "positive_flow";                                              // 3 (rating >= 4)
}

export async function classifyReview(input: Input): Promise<AIResult> {
  const c = getClient();
  if (!c) return heuristic(input);

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  try {
    const resp = await c.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify({ rating: input.rating, text: (input.text ?? "").slice(0, 2000), language: input.language ?? "he" }) },
      ],
    });
    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<AIResult>;
    const sentiment: Sentiment = SENTIMENTS.includes(parsed.sentiment as Sentiment)
      ? (parsed.sentiment as Sentiment)
      : input.rating >= 4 ? "positive" : input.rating === 3 ? "neutral" : "negative";
    return {
      sentiment,
      route: applyRoutingRules(input, parsed, false),
      confidence: clamp01(parsed.confidence ?? 0.6),
      summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 300) : "",
      suggested_business_response: typeof parsed.suggested_business_response === "string" ? parsed.suggested_business_response.slice(0, 1000) : "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t) => typeof t === "string").slice(0, 8) : [],
      severe_complaint: !!parsed.severe_complaint,
      fallback_used: false,
    };
  } catch {
    return heuristic(input);
  }
}

// --- Heuristic fallback -----------------------------------------------------
const NEG = ["גרוע","נורא","איום","גס","מאוכזב","תלונה","החזר","מגעיל","מלוכלך","חולה","הרעלה","איטי","מרושל","זוועה","בושה",
             "terrible","awful","horrible","rude","disgusting","refund","worst","dirty","sick"];
const NEGATION = ["לא ", "בלי ", "not ", "never "];

function heuristic(input: Input): AIResult {
  const text = (input.text ?? "").toLowerCase();
  const hasNeg = NEG.some((w) => {
    const i = text.indexOf(w);
    if (i < 0) return false;
    const before = text.slice(Math.max(0, i - 6), i);
    return !NEGATION.some((n) => before.endsWith(n)); // "לא גרוע" is not negative
  });
  const severe = hasNeg && input.rating >= 4;
  const llmLike: Partial<AIResult> = { severe_complaint: severe, route: hasNeg ? "recovery_flow" : undefined, confidence: 0.55 };
  const route = applyRoutingRules(input, llmLike, true);
  const sentiment: Sentiment = route === "recovery_flow" ? "negative" : input.rating >= 4 ? "positive" : "neutral";
  return {
    sentiment, route, confidence: 0.55,
    summary: (input.text ?? "").slice(0, 120),
    suggested_business_response: route === "recovery_flow"
      ? "תודה שפנית אלינו. מצטערים על החוויה, ונשמח לדבר כדי לתקן. אפשר ליצור קשר?"
      : "תודה רבה על המשוב החם! נשמח לראותך שוב בקרוב.",
    tags: hasNeg ? ["complaint"] : [],
    severe_complaint: severe,
    fallback_used: true,
  };
}
