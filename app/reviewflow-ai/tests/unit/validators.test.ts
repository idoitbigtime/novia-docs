import { describe, it, expect } from "vitest";
import { isValidRating, normalizePhone, normalizeEmail, clampText, slugify, isSafeWebhookUrl, isUuid } from "../../netlify/functions/_shared/validators";
import { parseBody } from "../../netlify/functions/_shared/http";

describe("isValidRating", () => {
  it("accepts integers 1..5 only", () => {
    expect(isValidRating(1)).toBe(true);
    expect(isValidRating(5)).toBe(true);
    expect(isValidRating(0)).toBe(false);
    expect(isValidRating(6)).toBe(false);
    expect(isValidRating(4.5)).toBe(false);
    expect(isValidRating("5")).toBe(false);
  });
});

describe("normalizePhone (mirrors SQL normalize_phone)", () => {
  it("Israeli local → E.164", () => {
    expect(normalizePhone("050-123-4567")).toBe("+972501234567");
    expect(normalizePhone("0501234567")).toBe("+972501234567");
  });
  it("keeps +, strips formatting", () => {
    expect(normalizePhone("+972 50 123 4567")).toBe("+972501234567");
    expect(normalizePhone("(+1) 415-555-0100")).toBe("+14155550100");
  });
  it("00 prefix → +", () => expect(normalizePhone("00972501234567")).toBe("+972501234567"));
  it("rejects junk", () => {
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("12")).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lowercases + validates", () => {
    expect(normalizeEmail("  Foo@Bar.COM ")).toBe("foo@bar.com");
    expect(normalizeEmail("nope")).toBeNull();
  });
});

describe("clampText", () => {
  it("trims, nulls empty, caps length", () => {
    expect(clampText("  hi ", 10)).toBe("hi");
    expect(clampText("   ", 10)).toBeNull();
    expect(clampText("x".repeat(50), 10)).toHaveLength(10);
    expect(clampText(123 as any, 10)).toBeNull();
  });
});

describe("slugify", () => {
  it("handles latin + hebrew + spaces", () => {
    expect(slugify("Pizza Roma!")).toBe("pizza-roma");
    expect(slugify("פיצה רומא")).toBe("פיצה-רומא");
  });
});

describe("isSafeWebhookUrl", () => {
  it("https hostnames only", () => {
    expect(isSafeWebhookUrl("https://services.leadconnectorhq.com/hooks/abc")).toBe(true);
    expect(isSafeWebhookUrl("http://example.com")).toBe(false);
    expect(isSafeWebhookUrl("https://127.0.0.1/x")).toBe(false);
    expect(isSafeWebhookUrl("https://localhost/x")).toBe(false);
    expect(isSafeWebhookUrl("not a url")).toBe(false);
  });
});

describe("parseBody never returns null", () => {
  it("handles 'null', arrays, garbage", () => {
    expect(parseBody({ body: "null" })).toEqual({});
    expect(parseBody({ body: "[1,2]" })).toEqual({});
    expect(parseBody({ body: "{bad" })).toEqual({});
    expect(parseBody({ body: '{"a":1}' })).toEqual({ a: 1 });
  });
});

describe("isUuid", () => {
  it("v4-ish only", () => {
    expect(isUuid("74089024-d5a6-4ba1-b0a5-49dba1700ff4")).toBe(true);
    expect(isUuid("x")).toBe(false);
  });
});
