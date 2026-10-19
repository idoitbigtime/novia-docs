// Privacy notice (purpose statement per Israel's Privacy Protection Law, Amendment 13).
// Business owners should review with counsel; this is a sensible default.
export default function Privacy() {
  return (
    <div dir="rtl" className="min-h-dvh bg-slate-50 px-4 py-8">
      <article className="card p-6 max-w-2xl mx-auto prose prose-slate prose-sm">
        <h1 className="text-2xl font-bold mb-4">מדיניות פרטיות — ReviewFlow AI</h1>
        <p>אנחנו אוספים את הפרטים שתבחרו למסור בטופס המשוב (דירוג, טקסט, ולבחירתכם שם, טלפון ואימייל).</p>
        <h2 className="font-bold mt-4">למה אנחנו משתמשים בפרטים</h2>
        <ul className="list-disc pr-5">
          <li>כדי להעביר את המשוב לעסק שבו ביקרתם ולאפשר לו לטפל בפנייתכם.</li>
          <li>כדי לשלוח לכם את ההטבה שניתנת על מתן המשוב.</li>
          <li>אם אישרתם זאת במפורש — כדי שהעסק יוכל ליצור איתכם קשר (לרבות בוואטסאפ) בנוגע למשוב ולהטבה.</li>
        </ul>
        <h2 className="font-bold mt-4">מה לא קורה</h2>
        <ul className="list-disc pr-5">
          <li>ההטבה אינה מותנית בפרסום ביקורת באף פלטפורמה.</li>
          <li>לא נשלח אליכם הודעות שיווקיות ללא הסכמה, ואפשר לבטל את ההסכמה בכל עת בפנייה לעסק.</li>
        </ul>
        <h2 className="font-bold mt-4">איפה הנתונים נשמרים</h2>
        <p>הנתונים נשמרים במערכות מאובטחות (Supabase, האיחוד האירופי) ומועברים למערכת ניהול הלקוחות של העסק (GoHighLevel) רק לאחר הסכמה.</p>
        <h2 className="font-bold mt-4">הזכויות שלכם</h2>
        <p>ניתן לבקש עיון, תיקון או מחיקה של הפרטים בפנייה לעסק או אלינו. בעלי עסקים שנרשמים למערכת נשמרים גם כאנשי קשר במערכת הפלטפורמה לצורך תפעול החשבון.</p>
        <p className="text-xs text-slate-400 mt-6">עודכן: 2026</p>
      </article>
    </div>
  );
}
