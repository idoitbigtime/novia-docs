"""5.2 — מחברים את fal.ai: ארנק מראש, ומשלמים רק על מה שיצא

Visual (from the approved script):
ארנק שנטען מראש. תוצאה מוצלחת יורדת מהיתרה, בעוד ששגיאת שרת והמתנה בתור מסומנות "לא משלמים", ולידן לוח שנה עם "תקף לשנה". אחר כך צעדי החיבור: מבקשים מקלוד ב-Claude Code להוסיף את השרת https://mcp.fal.ai/mcp-relay, כותבים /mcp ומתחברים בלי מפתח API. אם fal לא מופיע, סוגרים ופותחים את Claude Code באותה תיקייה. ב-claude.ai מוסיפים אותו כ-connector, בדיוק כמו Higgsfield.
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't52',
 'sim': 'sim52',
 'num': '5.2',
 'chapter': 'פרק 5 · חיבורים',
 'prompt': 15,
 'promptTitle': 'מתוך הפרומפט המוכן',
 'promptExcerpt': ['תבדוק ש-fal מחובר אליך'],
 'title': 'מחברים את fal.ai: ארנק מראש, ומשלמים רק על מה שיצא',
 'exp': 'ב-fal אין מנוי חובה. | קונים קרדיטים מראש בדשבורד החיובים, | וכל תוצאה שיצאה בהצלחה יורדת מהיתרה. | '
        'על שגיאה של השרת או על המתנה בתור {לא משלמים}, | והקרדיטים תקפים לשנה.',
 'promptDur': 6.0,
 'fact': {'pill': 'בערך דולר לקליפ',
          # guide: 'קלוד ממלא את החדר שמאחוריכם ... 15 סנט לתמונה' (in the model the guide used)
          'line': 'מחירים מהמדריך: קליפ AI של 5 שניות עם הפנים, בערך דולר. מילוי החדר שמאחוריכם, 15 סנט לתמונה.'},
 'hls': [('claude mcp add --transport http --scope user fal', 2.2, 0.1)],
 'tip': 'חלק מהמודלים חוסמים פנים אמיתיות, ולכן קלוד בוחר ב-fal מודל שמקבל אותן.',
 # the connection steps of the approved visual description need the longest payoff
 'payoff': 7.0,
 'sim52': {
     # the wallet of the title ("ארנק מראש"), fal's name as plain text; "יתרה" from the explanation ("יורדת מהיתרה")
     'wallet': 'fal', 'balance': 'יתרה',
     # beat labels, words of the explanation itself: "ב-fal אין מנוי חובה. קונים קרדיטים מראש בדשבורד החיובים,
     # וכל תוצאה שיצאה בהצלחה יורדת מהיתרה. על שגיאה של השרת או על המתנה בתור לא משלמים"
     'sub': 'מנוי חובה', 'dash': 'דשבורד החיובים', 'buy': 'קונים קרדיטים', 'ok': 'יצאה בהצלחה',
     'err': 'שגיאה של השרת', 'queue': 'המתנה בתור', 'free': 'לא משלמים',
     # approved visual description: 'ולידן לוח שנה עם "תקף לשנה"'; guide: "והקרדיטים שקניתם תקפים לשנה"
     'year': 'תקף לשנה',
     # payoff, relative to the end of the explanation: the description's connection steps. Guide: "תבקשו ממנו בקלוד קוד
     # להוסיף את השרת של fal בכתובת הזאת, ואחר כך תכתבו /mcp ותתחברו עם החשבון שלכם, בלי מפתח API.
     # https://mcp.fal.ai/mcp-relay  אם fal לא מופיע ב-/mcp, תסגרו את קלוד קוד ותפתחו אותו מחדש באותה תיקייה.
     # ב-claude.ai מוסיפים את fal בדיוק כמו את היגספילד, כ-connector"
     'tTerm': 0.35, 'tHint': 2.9, 'tWeb': 4.2,
     'steps': {
         'cc': 'Claude Code', 's1': 'מבקשים מקלוד להוסיף את השרת', 'url': 'https://mcp.fal.ai/mcp-relay',
         's2': 'כותבים /mcp ומתחברים בלי מפתח API', 'cmd': '/mcp', 'srv': 'fal',
         's3a': 'אם fal לא מופיע,', 's3b': 'סוגרים ופותחים את Claude Code באותה תיקייה',
         'web': 'claude.ai', 's4': 'מוסיפים אותו כ-connector, בדיוק כמו Higgsfield', 'chips': ['Higgsfield', 'fal'],
     },
 }}
