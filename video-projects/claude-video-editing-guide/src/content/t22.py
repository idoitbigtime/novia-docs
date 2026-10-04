"""2.2 Hebrew captions in two styles (prompt 2)."""
CFG = dict(
    id="t22", sim="sim22", num="2.2", chapter="פרק 2 · עריכה בסיסית",
    title="כתוביות בעברית בשני סגנונות",
    # "|" marks the explanation's phrases (not shown); the illustration has one beat per phrase
    exp=("התמלול נעשה עם המודל הגדול (large-v3), | כי ברירת המחדל של HyperFrames מבינה רק אנגלית. | "
         "אחר כך קלוד קורא כל כתובית {כמשפט שלם} | ומתקן מילים שנשמעות אותו דבר ונכתבות אחרת."),
    payoff=7.2,
    sim22=dict(
        # B1-B2 labels: words from the explanation itself
        bigLabel="המודל הגדול", defLabel="ברירת המחדל", defTag="רק אנגלית", token="א",
        # B3: the guide's example ("מחובר עליו" instead of "מחובר אליו", caught only by reading the whole sentence)
        capWords=("מחובר", "עליו", "אליו"),
        # B4: the guide's examples with their letter pairs (א/ע, ק/כ, ס/ז from the guide's list)
        fixStep=0.5,
        fixes=[("הקאבל", "הכבל", "ק/כ"), ("בסכוכית", "בזכוכית", "ס/ז"), ("עליו", "אליו", "א/ע")],
        # payoff, relative to the end of the explanation
        label1="סגנון 1 · גלולה לבנה", label2="סגנון 2 · קינטי",
        pills0=0.95, pillStep=0.58,
        pills=["הכתוביות", "מתחלפות", "בפריים אחד", "בלי אנימציה"],
        kin0=3.5, kinStep=0.27, kin="וכאן כל מילה נכנסת {בתנועה}",
    ),
    fact=dict(pill="9 טעויות תמלול", line="בקטע של 33 שניות: 7 נתפסו בקריאה, ו-2 רק באוזן.",
              meta="הכתוביות בסרטון הזה בנויות באותה שיטה."),
    prompt=2,
    promptDur=10.2,
    hls=[('`dir="rtl"` לא נכנס לתגית ה-html', 2.6, 0.10), ("כל מילה ב-span משלה", 3.2, 0.10)],
    tip="לפני שמאשרים, מקשיבים לכל מילה שקלוד מסמן שהוא לא בטוח בה.",
)
