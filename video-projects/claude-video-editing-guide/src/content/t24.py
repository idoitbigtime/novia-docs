"""2.4 — דוחפים לצבע המותג, והעור נשאר טבעי

Visual (from the approved script):
פריים מאויר עם קיר, חולצה ופנים. מעליו גלגל גוונים: נקודת המותג, טריז מוגן סביב גוון העור (12 מעלות ובמעבר חלק עד 30), עיגול אפור במרכז שלא זז, וחצים שמושכים גוונים קרובים לכיוון המותג. אחר כך שלוש עוצמות זו לצד זו: עדין 1.55 · בינוני 1.85 · חזק 2.2, עם תווית "בבינוני ובחזק העור זהה, כי ההגברה שלו נעצרת בפי 1.2".
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't24',
 'sim': 'sim24',
 'num': '2.4',
 'chapter': 'פרק 2 · עריכה בסיסית',
 'prompt': 4,
 'title': 'דוחפים לצבע המותג, והעור נשאר טבעי',
 'exp': 'קלוד מגביר את הצבעים ומושך לכיוון צבע המותג | רק את מה שכבר קרוב אליו, כמו קיר או חולצה. | {העור} '
        'מקבל רק רבע מההגברה, עם תקרה, | וצבעים שכמעט אפורים לא זזים, כדי שחולצה שחורה לא תכחיל.',
 'fact': {'line': 'בניסיון הראשון כל התמונה נמשכה לסגול והפנים יצאו ורודות. מודל שמזהה עור בכל פריים פתר את '
                  'זה.'},
 'hls': [('הבהירות לא זזה, לבן ושחור נשארים ניטרליים', 1.9, 0.1),
         ('אל תרנדר את כל הסרטון לפני שבחרתי עוצמה.', 1.9, 0.1)],
 'tip': 'צבע מותג קרוב לעור, כמו כתום או אדום? קלוד יגיד מראש שהדחיפה תצבע גם את הפנים.',
 # the payoff (three strengths side by side, the skin swatches, the label) needs more than the default 4.5 s
 'payoff': 6.0,
 # sim-only labels (every one quotes the explanation, the guide or the approved visual description)
 'sim24': {
     # B0. Explanation phrase 1: 'ומושך לכיוון צבע המותג'
     'brandLabel': 'צבע המותג',
     # B1. Explanation phrase 2: 'כמו קיר או חולצה'
     'wallLabel': 'קיר', 'teeLabel': 'חולצה',
     # B2. Explanation phrase 3: '{העור} מקבל רק רבע מההגברה, עם תקרה'; phrase 1: 'מגביר את הצבעים';
     # the cap value from guide prompt 4: 'מקבלים רבע מהגברת הרוויה, עד פי 1.2' (the wedge 12 / 30 degrees: the description)
     'skinWord': 'העור', 'colorsLabel': 'הצבעים', 'skinLabel': 'העור', 'capLabel': 'תקרה: פי 1.2',
     # B3. Explanation phrase 4: 'וצבעים שכמעט אפורים לא זזים, כדי שחולצה שחורה לא תכחיל'
     'greyLabel': 'כמעט אפורים', 'blackLabel': 'חולצה שחורה',
     # payoff. Description: 'שלוש עוצמות זו לצד זו: עדין 1.55 · בינוני 1.85 · חזק 2.2, עם תווית
     # "בבינוני ובחזק העור זהה, כי ההגברה שלו נעצרת בפי 1.2"'
     'strengths': ['עדין', 'בינוני', 'חזק'],
     'payoffLabel': 'בבינוני ובחזק העור זהה, כי ההגברה שלו נעצרת בפי 1.2',
     'capT': 2.75,
 }}
