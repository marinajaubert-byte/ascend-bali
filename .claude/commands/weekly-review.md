Run a weekly review of Mission Control.

Pull data:
1. GET /api/tasks?status=done&limit=50 — completed tasks (look for ones done this week)
2. GET /api/goals?status=active — progress on goals
3. GET /api/brain-dump?processed=false — ideas still unprocessed
4. GET /api/tasks?status=pending&limit=100 — backlog size

Produce a weekly review in this format:

**WINS THIS WEEK**
List tasks completed. Note any with revenue_score >= 4.

**GOAL PROGRESS**
For each active goal: is there visible progress from this week's tasks?

**BACKLOG HEALTH**
How many pending tasks? How many are do-now that haven't moved? Flag anything overdue.

**BRAIN DUMP**
How many unprocessed ideas? Should any be promoted to goals or tasks?

**NEXT WEEK FOCUS**
Recommend the top 3 things to prioritise next week based on goals + quadrant.

Keep it honest and direct. Flag anything that looks stuck.
