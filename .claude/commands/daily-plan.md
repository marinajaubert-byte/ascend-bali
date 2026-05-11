Build today's execution plan for Mission Control.

Steps:
1. GET /api/today — get top tasks, inbox summary, brain dump count
2. GET /api/goals?status=active — get active goals
3. GET /api/tasks?status=pending&limit=50 — get all pending tasks

Then produce a structured daily plan:

**TOP 3 ACTIONS** — the three things that will move the needle most today
(prioritise by: quadrant do-now > revenue_score 5 > due_date today)

**REVENUE FOCUS** — tasks with revenue_score >= 4, any client/sales/outreach work

**CLEAR THE INBOX** — list any unread messages needing response or approval

**BRAIN DUMP TRIAGE** — if unprocessed entries exist, suggest converting the best one to a task

**GOAL CHECK** — one sentence on whether today's actions connect to active goals

Keep the whole plan under 30 lines. Make it scannable, not a wall of text.
