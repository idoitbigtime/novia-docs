"""7.1 — מאשרים 15 שניות ברזולוציה נמוכה

Visual (from the approved script):
שני פסי התקדמות במרוץ: "רינדור מלא: כרבע שעה" מול "טיוטה: דקה וחצי". השוואת גדלים, 540×960 מול 1080×1920. לולאה של "טיוטה, תיקון, טיוטה", ואחריה "רינדור מלא אחד". תגית: "פריים בודד בלי רינדור: npx hyperframes snapshot --at <שנייה>".
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't71',
 'sim': 'sim71',
 'num': '7.1',
 'chapter': 'פרק 7 · חיסכון ברינדורים',
 'prompt': 19,
 'title': 'מאשרים 15 שניות ברזולוציה נמוכה',
 'exp': 'לפני הרינדור המלא, קלוד מרנדר 15 שניות מהקטע הכי עמוס | ב-540 על 960 ומחכה שתאשרו את הסגנון. | כל '
        'סבב תיקונים נשאר ברזולוציה הנמוכה, | ואת הגרסה המלאה מרנדרים {רק כשאין יותר תיקונים}.',
 'fact': {'line': 'גם הסרטון הזה אושר קודם כטיוטה של 15 שניות ב-540 על 960.'},
 'hls': [('לפני שאתה מרנדר את כל הסרטון, תרנדר 15 שניות מהקטע הכי עמוס', 2.2, 0.1)],
 'promptDur': 6.0,
 'tip': None,
 # payoff: the race of the two progress bars, then the single-frame tag (read time for the command)
 'payoff': 5.0,
 'sim71': {
     # B0: the explanation "קלוד מרנדר 15 שניות מהקטע הכי עמוס"
     'busyLabel': 'הקטע הכי עמוס',
     'secLabel': '15 שניות',
     # B1: the explanation "ב-540 על 960"; the approved visual "השוואת גדלים, 540×960 מול 1080×1920"
     # (guide: "סרטון של 1080 על 1920")
     'draftRes': '540×960',
     'fullRes': '1080×1920',
     # B1: the explanation "ומחכה שתאשרו את הסגנון"
     'styleLabel': 'הסגנון',
     # B2-B3: the approved visual "לולאה של "טיוטה, תיקון, טיוטה", ואחריה "רינדור מלא אחד""
     'loopDraft': 'טיוטה',
     'loopFix': 'תיקון',
     'oneLabel': 'רינדור מלא אחד',
     # payoff race, approved visual: "רינדור מלא: כרבע שעה" מול "טיוטה: דקה וחצי"
     # (guide: "רינדור אחד באיכות מלאה לקח לי בערך רבע שעה, וטיוטה ברזולוציה נמוכה דקה וחצי")
     'raceDraft': 'טיוטה: דקה וחצי',
     'raceFull': 'רינדור מלא: כרבע שעה',
     # the bars keep that ratio: a quarter hour / a minute and a half = 10
     'raceRatio': 10,
     # payoff tag, approved visual: "פריים בודד בלי רינדור: npx hyperframes snapshot --at <שנייה>"
     # (guide, prompt 19: "וב-HyperFrames פריים בודד יוצא בלי רינדור עם `npx hyperframes snapshot --at <שנייה>`")
     'snapLabel': 'פריים בודד בלי רינדור:',
     'snapCmd': 'npx hyperframes snapshot --at <שנייה>',
 }}
