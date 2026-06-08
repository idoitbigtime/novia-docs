import OpenAI from "openai";
import type { AIClassification } from "../../../src/lib/types";

let client: OpenAI | null = null;
function getClient() {
  if (client) return client;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  client = new OpenAI({ apiKey });
  return client;
}

const SYSTEM = `You are a customer-feedback analyst for local businesses (Hebrew-first).
Given a star rating (1–5) and free-text feedback, classify it and decide the routing.

Return STRICT JSON matching this schema:
{
  "sentiment": "positive" | "neutral" | "negative",
  "route": "positive_flow" | "recovery_flow" | "manual_review",
  "confidence": 0.0-1.0,
  "summary": "<= 1 sentence in the same language as the input>",
  "suggested_business_response": "<polite reply the owner could send, same language>",
  "tags": ["lowercase","short","keywords"]
}

Routing rules:
- rating >= 4 AND no severe complaint detected -> "positive_flow".
- rating <= 3 -> "recovery_flow".
- ANY strong complaint, anger, safety issue, hygiene issue, rudeness, or refund demand -> "recovery_flow" EVEN IF rating is 5.
- Empty/very-short text with high rating -> "positive_flow".
- Ambiguous, contradictory, or possibly abusive text -> "manual_review".
Never invent facts. No PII.`;

export async function classifyReview(input: { rating: number; text: string | null; language?: string }): Promise<AIClassification> {
  const c = getClient();
  if (!c) return heuristic(input);
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  try {
    const resp = await c.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify({ rating: input.rating, text: input.text ?? "", language: input.language ?? "he" }) },
      ],
    });
    const raw = resp.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<AIClassification>;
    return {
      sentiment: parsed.sentiment ?? "neutral",
      route: parsed.route ?? (input.rating >= 4 ? "positive_flow" : "recovery_flow"),
      confidence: clamp(parsed.confidence ?? 0.6),
      summary: parsed.summary ?? "",
      suggested_business_response: parsed.suggested_business_response ?? "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8) : [],
    };
  } catch {
    return heuristic(input);
  }
}

function clamp(n: number) { return Math.max(0, Math.min(1, n)); }

const NEG_HE = ["גרוע","נורא","איום","התעללו","גס","מאוכזב","תלונה","החזר","מגעיל","מלוכלך","חולה","הרעלה","איטי","מרושל"];

function heuristic(input: { rating: number; text: string | null }): AIClassification {
  const text = (input.text ?? "").toLowerCase();
  const hasNeg = NEG_HE.some((w) => text.includes(w));
  let route: AIClassification["route"];
  let sentiment: AIClassification["sentiment"];
  if (hasNeg) { route = "recovery_flow"; sentiment = "negative"; }
  else if (input.rating >= 4) { route = "positive_flow"; sentiment = "positive"; }
  else if (input.rating === 3) { route = "manual_review"; sentiment = "neutral"; }
  else { route = "recovery_flow"; sentiment = "negative"; }
  return {
    sentiment, route, confidence: 0.55,
    summary: input.text?.slice(0, 120) ?? "",
    suggested_business_response: "",
    tags: [],
  };
}
