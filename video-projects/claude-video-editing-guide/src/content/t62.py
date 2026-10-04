"""6.2 — הקלטתם עם Screen Studio? בלי זום נוסף

Visual (from the approved script):
הקלטת מסך מאוירת עם זום אוטומטי, ועליה זום קפיצי נוסף. התמונה מיטלטלת, ומופיע X אדום. אחר כך אותה הקלטה רק עם הזום שלה, וסימון ✓. בסוף בועת צ'אט, "מה להגיד לקלוד": "ההקלטה מ-Screen Studio, אז בלי זום קפיצי משלך." (במדריך אין לנושא הזה פרומפט מוכן, רק ההנחיה הזאת.)
"""
# '|' in exp marks the explanation's phrases (not shown on screen): the illustration has one beat per phrase.
CFG = {'id': 't62',
 'sim': 'sim62',
 'num': '6.2',
 'chapter': 'פרק 6 · הקלטות מסך',
 'prompt': None,
 'title': 'הקלטתם עם Screen Studio? בלי זום נוסף',
 'exp': 'Screen Studio היא תוכנה למק שמקליטה את המסך ומוסיפה זומים אוטומטיים. | ההקלטה כבר מלאה בזומים, | אז '
        'אומרים לקלוד במפורש לא להוסיף זום קפיצי משלו: | שני זומים אחד על השני {מסחררים} את מי שצופה.',
 'fact': None,
 'hls': [],
 'tip': None}
