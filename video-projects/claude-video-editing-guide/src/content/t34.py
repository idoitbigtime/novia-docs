"""3.4 — הפריים מתפרק לשכבות בתלת ממד

Visual (from the approved script):
קו אור דק מקיף את הפריים, וארבעה לוחות נפרדים בעומק, כל אחד על קפיץ משלו. המצלמה מסתובבת בערך 40 מעלות לצד ו-9 מלמעלה ומתרחקת. לכל לוח מסגרת אור ושם עם נקודה וקו, מהאחורי לקדמי: "החדר הריק" · "הטקסט על הקיר" · "אתם בלי הרקע" · "האפקטים". באיחוד הלוחות והמצלמה חוזרים יחד ונוחתים בלי שום הבדל.
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't34',
 'sim': 'sim34',
 'num': '3.4',
 'chapter': 'פרק 3 · אפקטים בתלת ממד',
 'prompt': 10,
 'title': 'הפריים מתפרק לשכבות בתלת ממד',
 'exp': 'על המילה שבחרתם הפריים נפרד לשכבות בעומק: | החדר הריק, הטקסט שעל הקיר, אתם בלי הרקע והאפקטים '
        'שלפניכם. | המצלמה מסתובבת, כל שכבה מקבלת שם בעברית, | ועל מילת האיחוד הכל נוחת בחזרה {בדיוק} בתמונה '
        'המקורית.',
 'fact': None,
 'hls': [('על מילת האיחוד כל השכבות והמצלמה חוזרות יחד', 1.9, 0.1),
         ('אל תכהה את החדר ואל תוסיף לו צבע', 1.9, 0.1)],
 'tip': 'מצלמים גם 3 שניות של החדר הריק, מאותה מצלמה ובאותו מקום. בלי זה קלוד ממלא את החדר עם מודל לעריכת '
        'תמונה ב-fal, וזה עולה כסף: 15 סנט לתמונה, במודל שנבדק.',
 # sim-only params (sims/sim34.*); every label quotes the guide or this file's approved visual description
 'sim34': dict(
     # layer names, back to front: the approved visual description (docstring above)
     names=["החדר הריק", "הטקסט על הקיר", "אתם בלי הרקע", "האפקטים"],
     # depth of each layer while apart, as a fraction of the frame width, back to front. Guide 3.4, prompt 10:
     # "בערך 0.83 מהרוחב אחורה לחדר, 0.42 לקיר, 0 לי ו-0.1 קדימה לאפקטים"
     depth=[-0.83, -0.42, 0.0, 0.1],
     # guide 3.4, prompt 10: "המצלמה מסתובבת לזווית של בערך 40 מעלות לצד ו-9 מעלות מלמעלה ומתרחקת בערך פי 1.4"
     yaw=40, pitch=9, pullBack=1.4,
     # the two words the effect sits on. Guide 3.4: 'בסרטון אמרתי "שהסצנה תתפרק בתלת ממד כדי שנראה את כל
     # השכבות שיש בפריים", וכמה שניות אחר כך "תאחד את השכבות".'
     splitWord="תתפרק", mergeWord="תאחד",
     # the text on the wall of the mock frame: the guide's own example (3.3):
     # 'אמרתי בסרטון "מאחור תוסיף באנימציה טקסט שאומר נתחיל מהקל לכבד"'
     wallText=["נתחיל מהקל", "לכבד"],
     # payoff label. Guide 3.4, prompt 10: "ונוחתות בדיוק בתמונה המקורית בלי שום הבדל"
     doneLabel="בלי שום הבדל",
 )}
