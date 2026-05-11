# Mission Control Integration Guide

These files integrate Mission Control features (Eisenhower matrix, brain dump,
goals, inbox, today dashboard) into your existing app at `~/golden-claw/mission-control/`.

**Estimated time to integrate: ~2 hours**

---

## Step 1 — Backup

```bash
cp -r ~/golden-claw/mission-control ~/golden-claw/mission-control.backup.$(date +%Y%m%d)
```

---

## Step 2 — Run database migration

```bash
sqlite3 ~/golden-claw/mission-control/crm.db < db-migration.sql
```

> If any `ALTER TABLE` line fails because the column already exists, delete that
> line and re-run. SQLite doesn't support `IF NOT EXISTS` for column additions.

Verify:
```bash
sqlite3 ~/golden-claw/mission-control/crm.db ".tables"
# Should show: mc_goals mc_goal_milestones mc_brain_dump mc_inbox mc_skills_library
```

---

## Step 3 — Add API routes

Copy these into your Next.js app's API directory:

```bash
APPDIR=~/golden-claw/mission-control/src/app/api

mkdir -p $APPDIR/goals/[id]
mkdir -p $APPDIR/brain-dump/[id]
mkdir -p $APPDIR/inbox/[id]
mkdir -p $APPDIR/today

# Copy and rename to route.ts (add TypeScript types as needed)
cp api-routes/goals.js        $APPDIR/goals/route.ts
cp api-routes/goals.js        $APPDIR/goals/[id]/route.ts   # PUT/DELETE for /api/goals/:id
cp api-routes/brain-dump.js   $APPDIR/brain-dump/route.ts
cp api-routes/brain-dump.js   $APPDIR/brain-dump/[id]/route.ts
cp api-routes/inbox.js        $APPDIR/inbox/route.ts
cp api-routes/inbox.js        $APPDIR/inbox/[id]/route.ts
cp api-routes/today.js        $APPDIR/today/route.ts
```

> Note: The route files combine GET+POST on the collection and PUT+DELETE on
> individual resources. Split into separate `route.ts` files per Next.js
> App Router conventions. The `[id]` routes need `params` from Next.js.

---

## Step 4 — Create /app/s page files

```bash
SDIR=~/golden-claw/mission-control/src/app/s

mkdir -p $SDIR/dashboard
mkdir -p $SDIR/today
mkdir -p $SDIR/tasks
mkdir -p $SDIR/goals
mkdir -p $SDIR/brain-dump
mkdir -p $SDIR/inbox

cp app-routes/s-dashboard-page.tsx  $SDIR/dashboard/page.tsx
cp app-routes/s-today-page.tsx      $SDIR/today/page.tsx
cp app-routes/s-tasks-page.tsx      $SDIR/tasks/page.tsx
cp app-routes/s-goals-page.tsx      $SDIR/goals/page.tsx
cp app-routes/s-brain-dump-page.tsx $SDIR/brain-dump/page.tsx
cp app-routes/s-inbox-page.tsx      $SDIR/inbox/page.tsx
```

---

## Step 5 — Add navigation links

In your layout.tsx (the sidebar or nav component), add:

```tsx
// Mission Control section
<NavLink href="/app/s/dashboard">Dashboard</NavLink>
<NavLink href="/app/s/today">Today</NavLink>
<NavLink href="/app/s/tasks">Tasks (Matrix)</NavLink>
<NavLink href="/app/s/goals">Goals</NavLink>
<NavLink href="/app/s/brain-dump">Brain Dump</NavLink>
<NavLink href="/app/s/inbox">Inbox</NavLink>
```

---

## Step 6 — Verify

```bash
cd ~/golden-claw/mission-control
npm run build      # or pnpm build
# Should complete with no errors

# Check routes resolve
curl http://localhost:3002/api/today
curl http://localhost:3002/api/goals
curl http://localhost:3002/api/brain-dump
curl http://localhost:3002/api/inbox
```

Then open in browser:
- http://localhost:3002/app/s/dashboard
- http://localhost:3002/app/s/today
- http://localhost:3002/app/s/tasks

---

## Terminal Remote Control (mc CLI)

After integration, you can manage Mission Control from any terminal:

```bash
# Install CLI dependencies (from this repo)
cd ~/mission-control-cli   # wherever you put mc.js
npm install

# Basic usage
node mc.js today
node mc.js tasks matrix
node mc.js brain add "idea to explore"
node mc.js goals
node mc.js inbox

# Via SSH from phone/iPad (once Remote Login is enabled on Mac)
# In Termius or any SSH app:
ssh marinajaubert@192.168.0.108
node ~/path/to/mc.js today
```

---

## Files in this integration package

| File | Purpose |
|------|---------|
| `db-migration.sql` | SQLite schema changes (additive only) |
| `api-routes/goals.js` | API handler for /api/goals |
| `api-routes/brain-dump.js` | API handler for /api/brain-dump |
| `api-routes/inbox.js` | API handler for /api/inbox |
| `api-routes/today.js` | API handler for /api/today |
| `app-routes/s-dashboard-page.tsx` | /app/s/dashboard page |
| `app-routes/s-today-page.tsx` | /app/s/today page |
| `app-routes/s-tasks-page.tsx` | /app/s/tasks (Eisenhower matrix) |
| `app-routes/s-goals-page.tsx` | /app/s/goals page |
| `app-routes/s-brain-dump-page.tsx` | /app/s/brain-dump page |
| `app-routes/s-inbox-page.tsx` | /app/s/inbox page |
