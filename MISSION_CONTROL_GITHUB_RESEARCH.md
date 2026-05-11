# Mission Control – GitHub Repo Research

**Source:** https://github.com/MeisnerDan/mission-control  
**Researched:** 2026-05-11  
**Purpose:** Evaluate and adapt for Marina's existing Mission Control dashboard

---

## What the GitHub Repo Does

MeisnerDan/mission-control is an open-source **AI agent command center** for solo entrepreneurs. Its core premise: the human makes high-level decisions while autonomous agents handle execution. It is not a generic project management tool — it is specifically designed for human-AI delegation workflows.

Primary tagline: **"Tame the swarm. Ship what matters."**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 |
| UI | shadcn/ui + Radix UI |
| Drag & Drop | @dnd-kit |
| Validation | Zod |
| Testing | Vitest (193 tests) |
| Storage | Local JSON files (no database) |
| Agent Runtime | Claude Code via CLI (`claude -p`) |

---

## Useful Features to Adapt

### HIGH VALUE — Adapt these

**1. Eisenhower Matrix (Quadrant Task View)**
- Tasks categorised by `importance` (high/low) + `urgency` (high/low)
- Four quadrants: Do Now / Schedule / Delegate / Eliminate
- Drag-and-drop between quadrants
- Currently Marina's app has tasks but no quadrant dimension — add `quadrant` column to tasks table

**2. Brain Dump**
- Quick single-field capture: one text box, press Enter
- Every entry has: `id`, `content`, `capturedAt`, `processed`, `convertedTo`, `tags[]`
- Triage workflow: mark as task / goal / archive
- Zero friction is the point — do not add forms

**3. Goals with Milestones**
- Goal has: `id`, `title`, `type`, `timeframe`, `parentGoalId`, `projectId`, `status`, `milestones[]`, `tasks[]`
- Goal types: outcome / habit / project / metric
- Status: active / completed / paused / cancelled
- Parent/child hierarchy for OKR-style nesting

**4. Inbox (Agent Reports & Approvals)**
- InboxMessage: `from` (agent role), `to`, `type` (report/question/approval), `subject`, `body`, `status` (unread/read/actioned)
- Approval workflow: human reviews agent-generated actions before execution
- This is where AI agent outputs surface for human oversight

**5. Today Command Center**
- Top 3 priorities (tasks with highest importance + urgency)
- Revenue-driving tasks
- Brain dump quick capture
- Inbox unread count
- Agent activity summary

**6. Token-Optimised API Design**
- Sparse field selection (`?fields=id,title,status`)
- Filtered queries (`?quadrant=do-now&assignedTo=me`)
- Pagination with metadata
- ~50 tokens per response vs ~5,400 for full payloads — critical for agent efficiency

**7. Slash Commands for Claude Code**
- `/standup` – daily standup from git + tasks + inbox
- `/daily-plan` – top priorities + inbox + decisions
- `/orchestrate` – coordinate all agents simultaneously
- These live in `.claude/commands/` and are auto-generated

**8. Agent Definition Schema**
- Agent: `name`, `icon`, `description`, `instructions`, `capabilities[]`, `skillIds[]`, `status`
- Skills library: reusable knowledge modules agents can reference
- Useful for Marina's agent management tab

---

## What to Avoid / Not Copy

- **JSON file storage** — Marina's app uses SQLite. Do not migrate to JSON. Adapt all data models to SQLite tables instead.
- **Field Ops / Ethereum / X adapters** — Complex external execution system. Out of scope for MVP.
- **Daemon background process** — Auto-spawning Claude Code sessions. Marina is the operator; she controls when agents run. Implement later if needed.
- **Encrypted vault** — AES-256 credential storage. Not needed in MVP; Marina's existing auth handles access.
- **193-test suite** — Vitest suite built for the JSON data layer. Marina's app uses different storage. Write new tests for SQLite layer only.
- **PM2 setup** — Marina's app already has its own process management. Do not duplicate.

---

## Architecture Comparison

| Dimension | MeisnerDan repo | Marina's existing app |
|-----------|----------------|----------------------|
| Storage | JSON files | SQLite (crm.db) |
| API port | Next.js built-in | localhost:3002 |
| Auth | None (local-only) | Existing auth layer |
| UI | shadcn/ui dark | Dark theme + Tailwind |
| Agent runtime | Claude Code CLI | Manual / future |
| Routes | /tasks, /goals, /inbox | /app/* (89 routes) |
| Target namespace | Root | /app/s (unused, available) |

---

## Recommendation: Integrate, Don't Fork

**Do not fork or install the GitHub repo as a separate app.** Marina's app has 89 working routes, a live CRM, SQLite database with 60+ tables, and a design system. Forking would create a duplicate system.

**Instead: cherry-pick the best patterns and build them inside /app/s**

Integration order (highest value first):
1. Eisenhower matrix — add `quadrant` column to tasks, build `/app/s/tasks` UI
2. Brain dump — new `mc_brain_dump` table, build `/app/s/brain-dump`
3. Goals — new `mc_goals` + `mc_goal_milestones` tables, build `/app/s/goals`
4. Inbox — new `mc_inbox` table, build `/app/s/inbox`
5. Today command center — `/app/s/today` aggregates the above
6. Agent manager — `/app/s/agents` (existing agent data + instructions + skills)

**Terminal remote control (`mc` CLI):** Provide a standalone `mc.js` CLI that connects to localhost:3002 so Marina can manage Mission Control from her terminal (or via SSH from phone/iPad).
