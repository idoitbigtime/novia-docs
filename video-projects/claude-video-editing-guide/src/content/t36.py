"""3.6 — הסרטונים הכי נצפים מסתובבים סביבכם

Visual (from the approved script):
שמונה כרטיסים לאורך עפים מקצוות המסך לקשת מאחורי הצללית, מרחפים, ואז הקשת יורדת למסלול נטוי שמאיץ. הכרטיסים הקרובים עוברים לפני הצללית והרחוקים מאחוריה, וקו אור חלש מצייר את המסלול. שלושת הראשונים מקבלים תווית עם אייקון של עין ("מספר צפיות אמיתי", בלי מספרים מומצאים). ביציאה הכרטיסים עפים החוצה.
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't36',
 'sim': 'sim36',
 'num': '3.6',
 'chapter': 'פרק 3 · אפקטים בתלת ממד',
 'prompt': 12,
 'title': 'הסרטונים הכי נצפים מסתובבים סביבכם',
 'exp': 'סרטונים שכבר הצליחו הם ההוכחה הכי טובה שאפשר לשים על המסך. | הם הופכים לכרטיסים קטנים שמתנגנים, | '
        'עולים לקשת מעל הראש | ואז מסתובבים במסלול סביבכם, {חצי מאחוריכם וחצי מלפניכם}.',
 'fact': {'pill': '8 הרילס הכי נצפים'},
 'hls': [('כרטיס עובר משכבה לשכבה רק כשהוא בקצה הצדדי של המסלול', 1.9, 0.1),
         ('מספר צפיות שלא נתתי לך לא עולה למסך.', 1.9, 0.1)],
 'tip': 'שמים מספר בתחילת השם של כל קובץ לפי הסדר מהנצפה ביותר, כי מהקבצים עצמם קלוד לא יכול לדעת.',
 # the payoff holds the orbit a little longer, then the cards fly out (approved visual description)
 'payoff': 5.0,
 # sim-only params (sims/sim36.*); every label quotes the guide or this file's approved visual description
 'sim36': dict(
     # eight cards: guide 3.6, "אצלי אלה היו 8 הרילס הכי נצפים שלי"
     cards=8,
     # the eye label on the three most viewed cards, without invented numbers: the approved visual description
     # (docstring above): 'שלושת הראשונים מקבלים תווית עם אייקון של עין ("מספר צפיות אמיתי", בלי מספרים מומצאים)'
     viewsLabel="מספר צפיות אמיתי",
     top=3,
 )}
