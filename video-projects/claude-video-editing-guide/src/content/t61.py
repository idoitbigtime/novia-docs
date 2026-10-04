"""6.1 — מוצאים ומטשטשים מיילים ופרטים אישיים

Visual (from the approved script):
תיבת דואר מאוירת עם מיילים פיקטיביים (כמו dana@example.com) וטלפון 050-0000000. קו סריקה עובר פעם בשנייה, והממצאים מקבלים מסגרת אדומה עם זמן. חלונית קופצת עם טלפון מופיעה לרגע ונתפסת. אחר כך הטשטוש נדלק רק בזמן של כל ממצא, והסריקה החוזרת מסתיימת ב-"0 ממצאים ✓".
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't61',
 'sim': 'sim61',
 'num': '6.1',
 'chapter': 'פרק 6 · הקלטות מסך',
 'prompt': 18,
 'title': 'מוצאים ומטשטשים מיילים ופרטים אישיים',
 'exp': 'קלוד קורא את הטקסט שעל המסך בכל שנייה של ההקלטה, | מוצא מיילים, טלפונים וכל פרט שביקשתם להסתיר, | '
        'ומטשטש אותו {בדיוק בזמן} שהוא על המסך. | בסוף הוא סורק שוב, כדי לוודא שלא נשאר אף אחד.',
 'fact': {'pill': '11 מתוך 11',
          'line': 'בהקלטה של 20 שניות: 10 מיילים וטלפון, כולל הודעה קופצת של 0.6 שנייה. בבדיקה של כל פריים '
                  'נתפסו עוד 5 פריימים.'},
 'hls': [('תריץ את זיהוי הטקסט מחדש על הקובץ החדש', 1.9, 0.1),
         ('אל תבנה שכבה נפרדת של חיתוך וטשטוש לכל אזור', 1.9, 0.1)],
 'tip': 'זיהוי הטקסט של המק לא קורא עברית. שם בעברית מסמנים לקלוד ידנית, ומבקשים טשטוש קבוע באזור הזה.',
 # the payoff is one result ("0 ממצאים ✓"), so it is a little shorter than the default
 'payoff': 4.0,
 'sim61': {
     # the approved visual description: "תיבת דואר מאוירת עם מיילים פיקטיביים (כמו dana@example.com) וטלפון 050-0000000"
     # (mock data: example.com addresses and 050-0000000 only); the 20-second recording and the popup's 0.6 s come from the
     # guide: "בהקלטה של 20 שניות ... כולל הודעה קופצת שהייתה על המסך 0.6 שנייה"
     'app': 'תיבת דואר',
     # (address, time it is first on screen, subject-bar width); the last one arrives at 0:10
     'mails': [['dana@example.com', '0:00', 118], ['client@example.com', '0:00', 96], ['team@example.com', '0:00', 112],
               ['info@example.com', '0:00', 104], ['office@example.com', '0:10', 100]],
     'phone': '050-0000000', 'phoneTag': '0:12',
     # guide, prompt 18: "תוציא פריים לכל שנייה"; the description: "והסריקה החוזרת מסתיימת ב-'0 ממצאים ✓'"
     'perSec': 'פריים לכל שנייה', 'rescan': 'סריקה חוזרת', 'result': '0 ממצאים',
     # the description: "והממצאים מקבלים מסגרת אדומה עם זמן ... אחר כך הטשטוש נדלק רק בזמן של כל ממצא"
     'laneFind': 'ממצאים', 'laneBlur': 'טשטוש',
     'marks': [0, 10, 12], 'segs': [[0, 20], [10, 20], [12, 12.6]],
 }}
