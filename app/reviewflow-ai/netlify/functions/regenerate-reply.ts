// Re-generates the suggested owner reply for a review (OpenAI, with a template fallback).
import type { Handler } from "@netlify/functions";
import OpenAI from "openai";
import { getServiceSupabase } from "./_shared/supabase";
import { requireUser, canEditBusiness } from "./_shared/authz";
import { ok, fail, parseBody, preflight } from "./_shared/http";
import { isUuid, clampText } from "./_shared/validators";

interface Body { review_id?: string; tone?: "warm" | "formal" | "short"; instructions?: string }

export const handler: Handler = async (event) => {
  const pre = preflight(event); if (pre) return pre;
  if (event.httpMethod !== "POST") return fail("METHOD_NOT_ALLOWED", 405);
  const user = await requireUser(event.headers as Record<string, string | undefined>);
  if (!user) return fail("UNAUTHORIZED", 401);

  const b = parseBody<Body>(event);
  if (!isUuid(b.review_id)) return fail("INVALID_INPUT");

  const sb = getServiceSupabase();
  const { data: r } = await sb.from("reviews").select("id, business_id, rating, text, ai_summary, ai_route, businesses(name)").eq("id", b.review_id).maybeSingle();
  if (!r) return fail("REVIEW_NOT_FOUND", 404);
  if (!(await canEditBusiness(user, r.business_id))) return fail("FORBIDDEN", 403);

  const bizName = (r as any).businesses?.name ?? "העסק";
  let reply: string | null = null;
  if (process.env.OPENAI_API_KEY) {
    try {
      const c = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 6000, maxRetries: 0 });
      const tone = b.tone === "formal" ? "רשמי ומכבד" : b.tone === "short" ? "קצר מאוד (עד 2 משפטים)" : "חם ואישי";
      const resp = await c.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini", temperature: 0.6, max_tokens: 300,
        messages: [
          { role: "system", content: `אתה כותב תגובות של בעל עסק ללקוחות בעברית. טון: ${tone}. אל תמציא עובדות, אל תבטיח פיצוי ספציפי, אל תציין פרסום ביקורת. חתום בשם העסק.` },
          { role: "user", content: `עסק: ${bizName}\nדירוג: ${r.rating}/5\nמשוב: ${r.text ?? "(ללא טקסט)"}\n${clampText(b.instructions, 300) ? `הנחיות נוספות: ${clampText(b.instructions, 300)}` : ""}` },
        ],
      });
      reply = resp.choices[0]?.message?.content?.trim() || null;
    } catch { reply = null; }
  }
  if (!reply) {
    reply = r.ai_route === "recovery_flow"
      ? `תודה שפנית אלינו ושיתפת. מצטערים שהחוויה לא הייתה כפי שציפית — זה חשוב לנו ונשמח לדבר ולתקן. צוות ${bizName}`
      : `תודה רבה על המילים החמות! שמחנו לארח אותך ונשמח לראותך שוב בקרוב. צוות ${bizName}`;
  }
  await sb.from("reviews").update({ ai_suggested_response: reply }).eq("id", r.id);
  return ok({ reply });
};
