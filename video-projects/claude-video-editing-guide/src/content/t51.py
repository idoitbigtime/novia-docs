"""5.1 — מחברים את Higgsfield

Visual (from the approved script):
חמישה צעדים ממוספרים בפאנלים מאוירים (לא העתק של הממשק האמיתי): 1. ב-claude.ai או באפליקציה: Customize, ואז Connectors · 2. לוחצים על הפלוס ובוחרים Add custom connector · 3. שם: Higgsfield · כתובת: https://mcp.higgsfield.ai/mcp · 4. Add, ואז Connect, ומתחברים לחשבון Higgsfield · 5. בלי מפתח API. מופיע לבד גם ב-Claude Code, ובודקים עם /mcp.
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't51',
 'sim': 'sim51',
 'num': '5.1',
 'chapter': 'פרק 5 · חיבורים',
 'prompt': 17,
 'title': 'מחברים את Higgsfield',
 'exp': 'יש בו יותר מ-30 מודלים ליצירת תמונות וסרטונים. | קלוד בוחר את המודל שמתאים לבקשה, | ובודק כמה '
        '{קרדיטים} הוא יעלה.',
 'fact': {'pill': '35 קרדיטים',
          'line': 'קליפ של 5 שניות במודל [Seedance 2.5], באיכות 720p, לאורך ובלי קול.',
          'meta': "החיבור דורש מנוי בתשלום ב-Higgsfield, וכל ג'נרוט יורד מהקרדיטים."},
 'hls': [("לפני כל ג'נרוט תבדוק את המחיר עם `get_cost: true`", 1.9, 0.1),
         ('אם אין מספיק קרדיטים, תעצור ותגיד לי כמה חסר', 1.9, 0.1)],
 # guide: 'אין צורך במפתח API ... ומהרגע הזה הוא מופיע לבד גם בקלוד קוד. אפשר לבדוק עם /mcp, הפקודה שמראה מה מחובר לקלוד.'
 'tip': 'אין צורך במפתח API: אחרי החיבור ב-claude.ai הוא מופיע לבד גם ב-Claude Code, ובודקים עם /mcp.',
 # the five connection steps need the longest payoff
 'payoff': 7.0,
 'sim51': {
     # B0-B1, words of the explanation itself: "יש בו יותר מ-30 מודלים ליצירת תמונות וסרטונים."
     'hub': 'Higgsfield', 'countPre': 'יותר מ-', 'count': 30, 'countPost': 'מודלים', 'cats': ['תמונות', 'סרטונים'],
     # B2: "קלוד בוחר את המודל שמתאים לבקשה"; the request is the guide's priced example:
     # "קליפ של 5 שניות במודל Seedance 2.5, באיכות 720p, לאורך ובלי קול, עולה 35 קרדיטים"
     'reqTag': 'הבקשה', 'req': 'קליפ של 5 שניות', 'fitLabel': 'המודל שמתאים',
     'scan': [[0, 0], [1, 4], [2, 2], [3, 5]], 'hero': [3, 5],
     # B3: the same guide sentence (Seedance 2.5, 35 credits); prompt 17 in the guide:
     # "לפני כל ג'נרוט תבדוק את המחיר עם `get_cost: true`, שלא מריץ שום דבר"
     'model': 'Seedance 2.5', 'getCost': 'get_cost: true', 'price': 35, 'priceLabel': 'קרדיטים',
     # payoff, relative to the end of the explanation: the approved visual description's five steps.
     # Guide: "ב-claude.ai או באפליקציה של קלוד נכנסים ל-Customize ואז ל-Connectors, לוחצים על הפלוס ובוחרים
     # Add custom connector. כותבים Higgsfield בשם, ומדביקים בשדה של הכתובת ... https://mcp.higgsfield.ai/mcp
     # לוחצים Add, ואז Connect, ומתחברים עם החשבון שלכם בהיגספילד. אין צורך במפתח API ... ומהרגע הזה הוא מופיע
     # לבד גם בקלוד קוד. אפשר לבדוק עם /mcp"
     'steps0': 0.4, 'stepGap': 0.95,
     'steps': {
         'customize': 'Customize', 'connectors': 'Connectors', 'where': 'ב-claude.ai או באפליקציה',
         'add_custom': 'Add custom connector',
         'name_lbl': 'שם', 'name': 'Higgsfield', 'url_lbl': 'כתובת', 'url': 'https://mcp.higgsfield.ai/mcp',
         'add': 'Add', 'connect': 'Connect', 'account': 'מתחברים לחשבון Higgsfield',
         'nokey': 'בלי מפתח API', 'also': 'מופיע לבד גם ב-Claude Code', 'cmd': '/mcp', 'listed': 'Higgsfield',
     },
 }}
