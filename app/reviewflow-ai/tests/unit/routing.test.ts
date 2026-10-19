import { describe, it, expect, beforeEach } from "vitest";
import { applyRoutingRules, classifyReview } from "../../netlify/functions/_shared/ai";

describe("applyRoutingRules — the code decides, the LLM advises", () => {
  it("rating <= 3 is ALWAYS recovery, even if the LLM says positive", () => {
    expect(applyRoutingRules({ rating: 1, text: "" }, { route: "positive_flow", confidence: 0.99 }, false)).toBe("recovery_flow");
    expect(applyRoutingRules({ rating: 3, text: "" }, { route: "positive_flow", confidence: 0.99 }, false)).toBe("recovery_flow");
  });

  it("5 stars + severe complaint → recovery", () => {
    expect(applyRoutingRules({ rating: 5, text: "x" }, { severe_complaint: true, route: "positive_flow" }, false)).toBe("recovery_flow");
  });

  it("rating >= 4 with no complaint → positive", () => {
    expect(applyRoutingRules({ rating: 4, text: "" }, { route: "positive_flow", confidence: 0.9 }, false)).toBe("positive_flow");
    expect(applyRoutingRules({ rating: 5, text: "" }, null, false)).toBe("positive_flow");
  });

  it("manual_review only when the real LLM is confident — never from the fallback", () => {
    expect(applyRoutingRules({ rating: 5, text: "" }, { route: "manual_review", confidence: 0.9 }, false)).toBe("manual_review");
    expect(applyRoutingRules({ rating: 5, text: "" }, { route: "manual_review", confidence: 0.4 }, false)).toBe("positive_flow");
    expect(applyRoutingRules({ rating: 5, text: "" }, { route: "manual_review", confidence: 0.9 }, true)).toBe("positive_flow");
  });

  it("garbage LLM route values are ignored", () => {
    expect(applyRoutingRules({ rating: 5, text: "" }, { route: "positive" as any, confidence: 1 }, false)).toBe("positive_flow");
  });
});

describe("classifyReview without an OpenAI key (outage / no key)", () => {
  beforeEach(() => { delete process.env.OPENAI_API_KEY; });

  it("5★ clean text stays positive (does NOT fall into manual review)", async () => {
    const r = await classifyReview({ rating: 5, text: "היה מעולה, תודה" });
    expect(r.route).toBe("positive_flow");
    expect(r.fallback_used).toBe(true);
  });

  it("5★ with a Hebrew complaint keyword → recovery", async () => {
    const r = await classifyReview({ rating: 5, text: "האוכל היה מגעיל" });
    expect(r.route).toBe("recovery_flow");
  });

  it("negation is respected: 'לא גרוע' is not a complaint", async () => {
    const r = await classifyReview({ rating: 4, text: "בכלל לא גרוע, נחמד" });
    expect(r.route).toBe("positive_flow");
  });

  it("2★ → recovery with a Hebrew suggested reply", async () => {
    const r = await classifyReview({ rating: 2, text: "" });
    expect(r.route).toBe("recovery_flow");
    expect(r.suggested_business_response.length).toBeGreaterThan(5);
  });
});
