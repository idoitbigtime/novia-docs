"""2.5 — קול באותה עוצמה: מינוס 14 LUFS

Visual (from the approved script):
גל קול לא אחיד עם שיאים אדומים "נשרף", ומד LUFS. "מעבר 1: מדידה" ואחריו "מעבר 2: linear", והגל מתיישר: קו יעד במינוס 14 ותקרת שיא במינוס 1. שלושה ערוצים: דיבור · מוזיקה (9 עד 13 dB מתחת לדיבור, ויורדת עוד 2 עד 4 בזמן דיבור) · אפקטים (בלי בס, highpass 200Hz).
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't25',
 'sim': 'sim25',
 'num': '2.5',
 'chapter': 'פרק 2 · עריכה בסיסית',
 'prompt': 5,
 'title': 'קול באותה עוצמה: מינוס 14 LUFS',
 'exp': 'גוללים בפיד, סרטון אחד צועק והבא כמעט לוחש? | היעד הוא {מינוס 14 LUFS}, | היחידה שמודדת כמה חזק '
        'משהו נשמע לאוזן. | קלוד מודד, מכוון ומודד שוב, | ובדרך מנקה את הבס מהאפקטים הקוליים.',
 'fact': {'pill': 'מינוס 13.9 LUFS',
          'line': 'אחרי התיקון, בלי אף רגע שנשרף.',
          'meta': 'גם הסאונד של הסרטון הזה עבר נרמול ככה: מינוס 14 LUFS, שיא עד מינוס 1.'},
 'hls': [('העוצמה הכוללת היא -14 LUFS', 1.9, 0.1), ('נרמול במעבר אחד עובד במצב דינמי', 1.9, 0.1)],
 'tip': 'מבקשים "קצת יותר שקט"? זה בערך 3 דציבלים, שנמדדים מול הגרסה הקודמת.',
 # the payoff (three channels mixed at the target, a play-through, then a hold) needs more than 4.5 s
 'payoff': 5.5,
 # sim-only labels (every one quotes the explanation, the guide or the approved visual description)
 'sim25': {
     # B0. Explanation phrase 1: 'סרטון אחד צועק והבא כמעט לוחש'; description: 'שיאים אדומים "נשרף"'
     'loudTag': 'צועק', 'quietTag': 'כמעט לוחש', 'burnTag': 'נשרף',
     # meter. Explanation phrase 2: 'היעד הוא מינוס 14 LUFS' (guide: '-14 LUFS'); description: 'ותקרת שיא במינוס 1'
     # (guide prompt 5: 'השיא האמיתי (true peak) לא עובר את -1')
     # (shown with a typographic minus sign)
     'meterTitle': 'LUFS', 'target': '\u221214', 'ceil': '\u22121',
     # B3. Description: '"מעבר 1: מדידה" ואחריו "מעבר 2: linear"'
     'pass1': 'מעבר 1: מדידה', 'pass2': 'מעבר 2: linear',
     # B4. Explanation phrase 5: 'מנקה את הבס מהאפקטים הקוליים'; description: 'אפקטים (בלי בס, highpass 200Hz)'
     'sfxTitle': 'אפקטים', 'hp': 'highpass 200Hz', 'noBass': 'בלי בס',
     # payoff. Description: 'שלושה ערוצים: דיבור · מוזיקה (9 עד 13 dB מתחת לדיבור, ויורדת עוד 2 עד 4 בזמן דיבור)
     # · אפקטים (בלי בס...)'; guide prompt 5: 'ובזמן שמדברים היא יורדת עוד 2 עד 4 dB'
     'lanes': ['דיבור', 'מוזיקה', 'אפקטים'], 'musicRel': '9 עד 13 dB מתחת לדיבור', 'sfxRel': 'בלי בס',
     'duckTag': 'יורדת עוד 2 עד 4 dB',
 }}
