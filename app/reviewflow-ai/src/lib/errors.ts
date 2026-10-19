// Maps server error codes (netlify/functions/_shared/http.ts) and common Supabase
// auth errors to Hebrew copy. Never show raw server text to customers.

const SERVER: Record<string, string> = {
  METHOD_NOT_ALLOWED: "פעולה לא נתמכת",
  INVALID_INPUT: "חלק מהפרטים לא תקינים, בדקו ונסו שוב",
  UNAUTHORIZED: "צריך להתחבר מחדש",
  FORBIDDEN: "אין הרשאה לפעולה הזו",
  BUSINESS_NOT_FOUND: "העסק לא נמצא",
  REVIEW_NOT_FOUND: "הביקורת לא נמצאה",
  COUPON_NOT_FOUND: "לא נמצאה הטבה לביקורת הזו",
  RATE_LIMITED: "יותר מדי ניסיונות, נסו שוב מאוחר יותר",
  QUOTA_EXCEEDED: "הגעתם למכסת העסקים המותרת",
  SLUG_TAKEN: "הכתובת הזו כבר תפוסה, בחרו אחרת",
  NOT_CONFIGURED: "השירות עדיין לא הוגדר",
  INTERNAL: "משהו השתבש אצלנו, נסו שוב בעוד רגע",
};

const FIELDS: Record<string, string> = {
  email: "כתובת המייל לא תקינה",
  phone: "מספר הטלפון לא תקין",
  name: "השם קצר מדי",
  platform: "הפלטפורמה לא מוגדרת לעסק",
  api_key: "מפתח ה-API לא תקין",
};

export function serverErrorToHebrew(code?: string | null, details?: { field?: string } | null): string {
  if (details?.field && FIELDS[details.field]) return FIELDS[details.field];
  return (code && SERVER[code]) || SERVER.INTERNAL;
}

/** Parse a fetch Response from our API into a Hebrew message. */
export async function apiError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return serverErrorToHebrew(j?.error, j?.details);
  } catch {
    return SERVER.INTERNAL;
  }
}

const AUTH: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "מייל או סיסמה שגויים"],
  [/email not confirmed/i, "צריך לאמת את כתובת המייל לפני הכניסה"],
  [/user already registered/i, "המייל הזה כבר רשום — נסו להתחבר"],
  [/password should be at least/i, "הסיסמה צריכה להכיל לפחות 6 תווים"],
  [/rate limit/i, "יותר מדי ניסיונות, נסו שוב בעוד דקה"],
  [/invalid email/i, "כתובת המייל לא תקינה"],
  [/network/i, "בעיית תקשורת — בדקו את החיבור לאינטרנט"],
];

export function authErrorToHebrew(message?: string | null): string {
  if (!message) return "הכניסה נכשלה, נסו שוב";
  for (const [re, he] of AUTH) if (re.test(message)) return he;
  return "הכניסה נכשלה, נסו שוב";
}
