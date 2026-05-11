Run a daily standup for Mission Control.

Query the API and report:
1. Top 5 tasks by quadrant (do-now first) and revenue score — use GET /api/tasks?status=pending,in_progress&limit=20
2. Any unread inbox messages — use GET /api/inbox?status=unread
3. Brain dump entries not yet processed — use GET /api/brain-dump?processed=false&limit=5
4. Active goals count — use GET /api/goals?status=active&limit=50

Format the output as a concise daily standup:
- What are the top priorities today?
- Any blockers or things needing approval?
- What ideas are sitting in the brain dump?
- What goals are in progress?

Keep it to under 20 lines. Be direct, no fluff.
