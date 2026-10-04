"""3.7 — זום קפיצי על המילה החשובה בכל משפט

Visual (from the approved script):
צללית מדברת עם כתוביות. על כל מילה חשובה התמונה נכנסת 12 אחוז בקפיץ, וחוזרת למקום במשפט הבא. לידה גרף של עקומת ה-ease מהמדריך שמצטייר בזמן אמת, ובמשפט ארוך דחיפה איטית של 3 אחוז.
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't37',
 'sim': 'sim37',
 'num': '3.7',
 'chapter': 'פרק 3 · אפקטים בתלת ממד',
 'prompt': 13,
 'title': 'זום קפיצי על המילה החשובה בכל משפט',
 'exp': 'לא כל סרטון צריך תלת ממד. | בכל משפט יש מילה אחת שהכי חשובה, | וקלוד מקרב עליה את התמונה ב-10 עד 15 '
        'אחוז | {בתנועת קפיץ}, בדיוק כשהיא נאמרת. | מרכז הזום תמיד על הפנים, והוא מתאפס בחיתוך הבא.',
 'fact': {'pill': '10 עד 15 אחוז',
          'line': 'בפתיחה של 7 שניות נבחרו שלוש מילים: "קלוד", "נבדוק" ו"אותו".',
          'meta': 'שמתם לב? הזום הזה מופיע לאורך כל הסרטון.'},
 'hls': [('ותבחר בכל משפט לכל היותר מילה אחת, הכי חזקה', 1.9, 0.1),
         ('הזום נשאר עד החיתוך הבא וחוזר שם ל-100 אחוז בבת אחת', 1.9, 0.1)],
 'tip': 'זום של 15 אחוז על סרטון של 1080 מרכך את התמונה. יודעים מראש שתעשו זומים? מצלמים ב-4K.',
 # the payoff plays the guide's whole opening: three punch-ins, then the slow push on the long sentence
 'payoff': 6.5,
 # sim-only params (sims/sim37.*); every label quotes the guide or this file's approved texts
 'sim37': dict(
     # the important words, one per sentence. Guide 3.7: 'בפתיחה של 7 שניות מהסרטון שלי קלוד בחר את "קלוד",
     # "נבדוק" ו"אותו", ובמשפט האחרון ויתר על זום ושם רק דחיפה איטית של 3 אחוז.'
     words=["קלוד", "נבדוק", "אותו"],
     # the punch-in. Guide 3.7 (image caption): "זום קפיצי של 12 אחוז על המילה החשובה בכל משפט"
     zoom=12,
     # the range on the meter: the explanation, "ב-10 עד 15 אחוז"
     zoomRange=[10, 15],
     # the slow push on the long sentence (guide 3.7, above) and the reset level. Guide, prompt 13:
     # "הזום נשאר עד החיתוך הבא וחוזר שם ל-100 אחוז בבת אחת"
     push=3, base=100,
     # the cut on the timeline: the explanation, "והוא מתאפס בחיתוך הבא"
     cutLabel="חיתוך",
 )}
