Triage the brain dump and inbox — process everything that's sitting unreviewed.

Steps:
1. GET /api/brain-dump?processed=false&limit=20
2. GET /api/inbox?status=unread&limit=20
3. GET /api/goals?status=active — for context on what goals exist

For each brain dump entry, recommend one of:
- Convert to task (and suggest a quadrant + revenue score)
- Convert to goal
- Archive (not actionable now)

For each inbox message, recommend:
- Action needed (what specifically)
- Mark read (informational only)
- Reply needed

Then ask: "Should I execute any of these? Tell me which ones."

Do NOT execute anything automatically. Present the triage list and wait for confirmation.
