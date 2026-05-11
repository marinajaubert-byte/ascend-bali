# Current State Audit – Marina's Mission Control App

**App location:** `/Users/marinajaubert/golden-claw/mission-control/`  
**API:** localhost:3002  
**Audited:** 2026-05-11

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (dark theme) |
| UI | lucide-react icons |
| Database | SQLite — crm.db, websites.db |
| API | localhost:3002 |
| Process | PM2 / local dev server |

---

## Existing Routes (89 total)

### Active / Working Routes
- `/app/app` — Main app shell
- `/app/app/cloud-work-review` — 9-tab cloud work review dashboard
- `/app/app/crm` — CRM module (contacts, companies, opportunities)
- `/app/app/agents` — Agent management
- `/app/app/projects` — Projects
- `/app/app/tasks` — Tasks (no Eisenhower quadrant yet)
- `/app/app/opportunities` — Sales pipeline

### Available Namespace (completely empty)
- `/app/s/*` — **Unused. Zero routes. Zero files. Safe to build here.**

---

## Database (crm.db — 60+ tables)

### Existing tables relevant to Mission Control

| Table | Purpose |
|-------|---------|
| tasks | Task management (missing: quadrant, goal_id, revenue_score) |
| agents | AI agent definitions (missing: instructions, capabilities, skill_ids) |
| projects | Project tracking |
| opportunities | CRM pipeline |
| contacts | CRM contacts |
| companies | CRM companies |

### Missing tables (to be created non-destructively)

| Table | Purpose |
|-------|---------|
| mc_goals | Long-term goal tracking |
| mc_goal_milestones | Milestones linked to goals |
| mc_brain_dump | Quick idea capture |
| mc_inbox | Agent reports, questions, approvals |
| mc_skills_library | Reusable knowledge modules for agents |

### Missing columns on existing tables (additive only)

**tasks table:**
- `quadrant` TEXT — 'do-now' | 'schedule' | 'delegate' | 'eliminate'
- `goal_id` INTEGER — FK to mc_goals
- `revenue_score` INTEGER — 1-5 (1=side quest, 5=direct revenue)
- `cost_tokens` INTEGER — token cost if AI-generated

**agents table:**
- `instructions` TEXT — detailed agent instructions
- `capabilities` TEXT — JSON array of capability strings
- `skill_ids` TEXT — JSON array of mc_skills_library IDs

---

## What Is Already Working

- CRM with contacts, companies, opportunities
- Cloud-work-review dashboard (9 tabs)
- Agent listing
- Project and task basic views
- SQLite data layer
- localhost:3002 API with auth

## What Is Missing (Mission Control features)

- Eisenhower matrix for tasks (no quadrant dimension)
- Brain dump / quick capture
- Goal hierarchy with milestones
- Inbox for agent reports and approvals
- Today command center (daily focus view)
- Revenue scoring on tasks
- Terminal CLI for remote access

## What Must Not Be Duplicated

- Do NOT create a second CRM — existing CRM at /app/app/crm is working
- Do NOT create a second tasks table — add columns to existing one
- Do NOT create a second agents table — extend existing one
- Do NOT create a second projects route — /app/s/projects should read from existing projects table
- Do NOT install a separate Next.js app — build inside /app/s

---

## API Endpoints (localhost:3002)

### Currently available
- `GET /api/agents` — list agents
- `GET /api/projects` — list projects
- `GET/POST /api/tasks` — tasks CRUD
- `GET/POST /api/opportunities` — opportunities

### To be added for Mission Control
- `GET/POST /api/goals` — mc_goals table
- `GET/POST /api/brain-dump` — mc_brain_dump table
- `GET/POST /api/inbox` — mc_inbox table
- `GET /api/today` — aggregated daily focus view
- `GET/POST /api/skills` — mc_skills_library table

---

## Navigation

Current navigation does not expose /app/s. New navigation items to add to layout.tsx:

```
Mission Control
  ├── Today          /app/s/today
  ├── Dashboard      /app/s/dashboard
  ├── Tasks (Matrix) /app/s/tasks
  ├── Goals          /app/s/goals
  ├── Brain Dump     /app/s/brain-dump
  ├── Inbox          /app/s/inbox
  └── Agents         /app/s/agents
```

---

## Integration Risk Assessment

| Change | Risk | Notes |
|--------|------|-------|
| Add columns to tasks table | Low | SQLite ALTER TABLE ADD COLUMN is non-destructive |
| Add columns to agents table | Low | Same — additive only |
| Create new mc_* tables | None | New tables, no existing data affected |
| Add /app/s routes | None | Unused namespace |
| Add API endpoints | None | New routes, existing ones unchanged |
| Update navigation | Low | Additive — new items only |

**Overall risk: LOW. Zero breaking changes to existing 89 routes.**
