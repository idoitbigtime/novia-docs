"""2.3 — מ-16:9 ל-9:16, והחיתוך זז עם הפנים

Visual (from the approved script):
פריים לרוחב עם חדר מאויר וצללית שזזה. קודם חיתוך קבוע (קו מקווקו אפור) חותך חצי ראש, ומסומן X. אחר כך מסגרת אדומה עוקבת אחרי הפנים: רצועת "אזור מת: כ-8 אחוז מהרוחב" שבתוכה החיתוך לא זז, וקפיץ רך כשהפנים יוצאות ממנה. לידה הפלט לאורך, עם קו העיניים בשליש העליון וקווי האזור הבטוח 140 ו-940.
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't23',
 'sim': 'sim23',
 'num': '2.3',
 'chapter': 'פרק 2 · עריכה בסיסית',
 'prompt': 3,
 'title': 'מ-16:9 ל-9:16, והחיתוך זז עם הפנים',
 'exp': 'חיתוך קבוע באמצע יעיף לכם חצי ראש ברגע שזזתם. | קלוד מוצא את הפנים בכל פריים, | מזיז את החיתוך '
        'אחריהן {בתנועה רכה}, | ומשאיר כל טקסט באזור שהטלפון לא חותך.',
 'fact': {'pill': '777 מתוך 777 פריימים',
          'line': 'הפנים נמצאו בכל הפריימים, וזזו כל כך מעט שהחיתוך נשאר במקום.'},
 'hls': [('החיתוך זז רק כשהגוף שלי זז באמת', 1.9, 0.1),
         ('כל טקסט או גרפיקה שנוסיף אחר כך יושבים בין x 140 ל-940', 1.9, 0.1)],
 'tip': 'בטלפונים גבוהים אינסטגרם חותך בערך 100 פיקסלים מכל צד, ולכן טקסט יושב בין פיקסל 140 ל-940 מתוך '
        '1080. גם בסרטון הזה.',
 # the payoff (eye line, one more soft follow, then a hold) needs a little more than the default 4.5 s
 'payoff': 5.0,
 # sim-only labels (every one quotes the guide, the title, the explanation or the approved visual description)
 'sim23': {
     # frame tags: the title 'מ-16:9 ל-9:16'
     'tagSrc': '16:9', 'tagOut': '9:16',
     # B0. Explanation phrase 1: 'חיתוך קבוע באמצע יעיף לכם חצי ראש'
     'fixLabel': 'חיתוך קבוע',
     # B2. Description: 'רצועת "אזור מת: כ-8 אחוז מהרוחב"'; guide prompt 3: 'אזור מת של בערך 8 אחוז מרוחב המקור'
     'zoneLabel': 'אזור מת: כ-8 אחוז מהרוחב',
     # B3. Explanation phrase 4: 'ומשאיר כל טקסט באזור שהטלפון לא חותך'; guide: 'תשימו לב לאזור הבטוח...
     # טקסט צריך לשבת בין פיקסל 140 לפיקסל 940 מתוך 1080' (the lines 140 and 940 are in the description)
     'textPill': 'טקסט', 'safeLabel': 'אזור בטוח',
     # payoff. Description: 'עם קו העיניים בשליש העליון'; guide prompt 3: 'העיניים יושבות בערך בשליש העליון של הפריים'
     'eyeLabel': 'העיניים בשליש העליון',
 }}
