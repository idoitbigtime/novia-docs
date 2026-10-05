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
 # [..] keeps words on one line (markup, not shown): the title breaks after "?", never inside the name
 'title': '[הקלטתם עם Screen Studio?] [בלי זום נוסף]',
 'exp': 'Screen Studio היא תוכנה למק שמקליטה את המסך ומוסיפה זומים אוטומטיים. | ההקלטה כבר מלאה בזומים, | אז '
        'אומרים לקלוד במפורש לא להוסיף זום קפיצי משלו: | שני זומים אחד על השני {מסחררים} את מי שצופה.',
 'fact': None,
 'hls': [],
 'tip': None,
 # payoff: the clean zoom + check mark, then the instruction bubble holds (this topic has no prompt card)
 'payoff': 5.0,
 'sim62': {
     # B0 recorder pill: the app's name as plain text (guide: "Screen Studio היא תוכנה למק שמקליטה את המסך")
     'recName': 'Screen Studio',
     # B0-B1, B3 legend: approved visual "הקלטת מסך מאוירת עם זום אוטומטי" (guide: "מוסיפה זומים אוטומטיים")
     'autoLabel': 'זום אוטומטי',
     # B3 legend: the explanation "לא להוסיף זום קפיצי משלו"
     'bouncyLabel': 'זום קפיצי',
     # B2 + payoff chat bubble, verbatim from the approved script:
     # 'מה להגיד לקלוד: בועת צ'אט: "ההקלטה מ-Screen Studio, אז בלי זום קפיצי משלך."'
     'askLabel': 'מה להגיד לקלוד',
     'askL1': ('ההקלטה מ-', 'Screen Studio', ','),
     'askL2': 'אז בלי זום קפיצי משלך.',
 }}
