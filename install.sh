#!/usr/bin/env bash
# ================================================================
#  MISSION CONTROL — Full Mac Integration
#  One command. Backs up, migrates DB, wires up all routes.
#
#  Usage:
#    bash install.sh
#
#  What it does:
#    1. Locates your Mission Control app
#    2. Creates a timestamped backup
#    3. Migrates crm.db (adds mc_* tables + columns, safe to re-run)
#    4. Copies all /app/s page files
#    5. Copies all /api route files (properly split for Next.js App Router)
#    6. Installs the mc CLI to ~/bin/mc
#    7. Type-checks the app
#    8. Prints what to do next
# ================================================================

set -e

# ── Config ───────────────────────────────────────────────────
MC="${MC_DIR:-$HOME/golden-claw/mission-control}"
CLI_REPO="https://github.com/marinajaubert-byte/ascend-bali"
CLI_BRANCH="claude/terminal-remote-control-X6CZn"
CLI_DIR="$HOME/golden-claw/mc-cli"

# ── Colours ──────────────────────────────────────────────────
G='\033[0;32m'; Y='\033[0;33m'; R='\033[0;31m'; B='\033[0m'
ok()   { echo -e "${G}  ✓ $*${B}"; }
warn() { echo -e "${Y}  ⚠  $*${B}"; }
err()  { echo -e "${R}  ✗ $*${B}"; exit 1; }
hdr()  { echo -e "\n${Y}── $* ──────────────────────────────────────────${B}"; }

echo ""
echo -e "${Y}  ✦ Mission Control Integration${B}"
echo "  ════════════════════════════════════════════"

# ── 1. Verify Mission Control ─────────────────────────────
hdr "1. Locating Mission Control"
if [ ! -d "$MC" ]; then
  err "Not found: $MC\n     Set MC_DIR env var:  MC_DIR=/path/to/app bash install.sh"
fi
ok "Found at $MC"

SRC="$MC/src/app"
if [ ! -d "$SRC" ]; then
  err "No src/app directory in $MC — is this the right folder?"
fi

# ── 2. Backup ─────────────────────────────────────────────
hdr "2. Backup"
BACKUP="$MC.backup.$(date +%Y%m%d_%H%M%S)"
cp -r "$MC" "$BACKUP"
ok "Backup → $BACKUP"

# ── 3. Get integration files ───────────────────────────────
hdr "3. Fetching integration files"
if [ -d "$CLI_DIR/.git" ]; then
  git -C "$CLI_DIR" fetch --quiet origin "$CLI_BRANCH"
  git -C "$CLI_DIR" checkout --quiet "$CLI_BRANCH"
  git -C "$CLI_DIR" pull --quiet --ff-only
  ok "Updated mc-cli at $CLI_DIR"
else
  git clone "$CLI_REPO" --branch "$CLI_BRANCH" --single-branch --quiet "$CLI_DIR"
  ok "Cloned mc-cli to $CLI_DIR"
fi
INT="$CLI_DIR/integration"

# ── 4. Database migration (safe, idempotent) ───────────────
hdr "4. Database migration"
python3 - "$MC" <<'PYEOF'
import sqlite3, os, sys, glob

mc = sys.argv[1]
candidates = glob.glob(f"{mc}/**/*.db", recursive=True) + glob.glob(f"{mc}/*.db")
db_path = next((p for p in candidates if os.path.basename(p) == "crm.db"), None)
if not db_path:
    print("  ✗ crm.db not found — checked:", mc)
    sys.exit(1)

print(f"  DB: {db_path}")
conn = sqlite3.connect(db_path)
cur  = conn.cursor()

def has_col(table, col):
    try:
        cur.execute(f"SELECT {col} FROM {table} LIMIT 0")
        return True
    except Exception:
        return False

def has_table(name):
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,))
    return cur.fetchone() is not None

# Tasks columns
for col, defn in [
    ("quadrant",      "TEXT DEFAULT NULL"),
    ("goal_id",       "INTEGER DEFAULT NULL"),
    ("revenue_score", "INTEGER DEFAULT 3"),
    ("cost_tokens",   "INTEGER DEFAULT NULL"),
]:
    if not has_col("tasks", col):
        cur.execute(f"ALTER TABLE tasks ADD COLUMN {col} {defn}")
        print(f"  + tasks.{col}")
    else:
        print(f"  ✓ tasks.{col}")

# Agents columns
for col, defn in [
    ("instructions", "TEXT DEFAULT NULL"),
    ("capabilities", "TEXT DEFAULT NULL"),
    ("skill_ids",    "TEXT DEFAULT NULL"),
]:
    if not has_col("agents", col):
        cur.execute(f"ALTER TABLE agents ADD COLUMN {col} {defn}")
        print(f"  + agents.{col}")
    else:
        print(f"  ✓ agents.{col}")

# New tables
cur.executescript("""
CREATE TABLE IF NOT EXISTS mc_goals (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  title          TEXT    NOT NULL,
  type           TEXT    NOT NULL DEFAULT 'outcome',
  timeframe      TEXT,
  parent_goal_id INTEGER REFERENCES mc_goals(id),
  project_id     INTEGER,
  status         TEXT    NOT NULL DEFAULT 'active',
  notes          TEXT,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  deleted_at     TEXT    DEFAULT NULL
);
CREATE TABLE IF NOT EXISTS mc_goal_milestones (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id    INTEGER NOT NULL REFERENCES mc_goals(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  done       INTEGER NOT NULL DEFAULT 0,
  due_date   TEXT,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS mc_brain_dump (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  content     TEXT    NOT NULL,
  captured_at TEXT    NOT NULL DEFAULT (datetime('now')),
  processed   INTEGER NOT NULL DEFAULT 0,
  converted_to TEXT   DEFAULT NULL,
  tags        TEXT    DEFAULT NULL
);
CREATE TABLE IF NOT EXISTS mc_inbox (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  from_agent TEXT    NOT NULL DEFAULT 'system',
  to_agent   TEXT    NOT NULL DEFAULT 'me',
  type       TEXT    NOT NULL DEFAULT 'report',
  task_id    INTEGER DEFAULT NULL,
  subject    TEXT    NOT NULL,
  body       TEXT,
  status     TEXT    NOT NULL DEFAULT 'unread',
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  read_at    TEXT    DEFAULT NULL
);
CREATE TABLE IF NOT EXISTS mc_skills_library (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE,
  description TEXT,
  content     TEXT,
  tags        TEXT    DEFAULT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tasks_quadrant       ON tasks(quadrant);
CREATE INDEX IF NOT EXISTS idx_tasks_revenue_score  ON tasks(revenue_score);
CREATE INDEX IF NOT EXISTS idx_mc_brain_dump_proc   ON mc_brain_dump(processed);
CREATE INDEX IF NOT EXISTS idx_mc_inbox_status      ON mc_inbox(status);
CREATE INDEX IF NOT EXISTS idx_mc_goals_status      ON mc_goals(status);
""")
conn.commit()
conn.close()
print("  ✓ Migration complete")
PYEOF
ok "Database migrated"

# ── 5. /app/s page files ──────────────────────────────────
hdr "5. Creating /app/s pages"
mkdir -p \
  "$SRC/s/dashboard" \
  "$SRC/s/today"     \
  "$SRC/s/tasks"     \
  "$SRC/s/goals"     \
  "$SRC/s/brain-dump" \
  "$SRC/s/inbox"

cp "$INT/app-routes/s-dashboard-page.tsx"  "$SRC/s/dashboard/page.tsx"
cp "$INT/app-routes/s-today-page.tsx"      "$SRC/s/today/page.tsx"
cp "$INT/app-routes/s-tasks-page.tsx"      "$SRC/s/tasks/page.tsx"
cp "$INT/app-routes/s-goals-page.tsx"      "$SRC/s/goals/page.tsx"
cp "$INT/app-routes/s-brain-dump-page.tsx" "$SRC/s/brain-dump/page.tsx"
cp "$INT/app-routes/s-inbox-page.tsx"      "$SRC/s/inbox/page.tsx"
ok "Page files written"

# ── 6. API routes (properly split for App Router) ─────────
hdr "6. Creating API routes"
mkdir -p \
  "$SRC/api/goals/[id]"       \
  "$SRC/api/brain-dump/[id]"  \
  "$SRC/api/inbox/[id]"       \
  "$SRC/api/today"

cp "$INT/api-routes/goals-collection.ts"   "$SRC/api/goals/route.ts"
cp "$INT/api-routes/goals-id.ts"           "$SRC/api/goals/[id]/route.ts"
cp "$INT/api-routes/brain-dump-collection.ts" "$SRC/api/brain-dump/route.ts"
cp "$INT/api-routes/brain-dump-id.ts"      "$SRC/api/brain-dump/[id]/route.ts"
cp "$INT/api-routes/inbox-collection.ts"   "$SRC/api/inbox/route.ts"
cp "$INT/api-routes/inbox-id.ts"           "$SRC/api/inbox/[id]/route.ts"
cp "$INT/api-routes/today.ts"              "$SRC/api/today/route.ts"
ok "API routes written"

# ── 7. Install mc CLI ──────────────────────────────────────
hdr "7. Installing mc CLI"
cd "$CLI_DIR"
npm install --silent 2>/dev/null
chmod +x mc.js
mkdir -p "$HOME/bin"
ln -sf "$CLI_DIR/mc.js" "$HOME/bin/mc"
export PATH="$HOME/bin:$PATH"

# Persist PATH in shell config
SHELL_RC="$HOME/.zshrc"
[ -f "$HOME/.bashrc" ] && SHELL_RC="$HOME/.bashrc"
if ! grep -q 'mc-cli\|HOME/bin' "$SHELL_RC" 2>/dev/null; then
  echo 'export PATH="$HOME/bin:$PATH"' >> "$SHELL_RC"
fi
ok "mc command installed → ~/bin/mc"

# ── 8. Type-check ─────────────────────────────────────────
hdr "8. Type check"
cd "$MC"
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  warn "Type errors present — review output below"
  npx tsc --noEmit 2>&1 | grep "error TS" | head -20
else
  ok "Type check passed"
fi

# ── 9. Summary ────────────────────────────────────────────
echo ""
echo -e "${Y}  ════════════════════════════════════════════${B}"
echo -e "${Y}  ✦ Integration complete!${B}"
echo ""
echo "  New routes (restart server to activate):"
echo "    /app/s/dashboard  — Mission Control home"
echo "    /app/s/today      — Daily focus"
echo "    /app/s/tasks      — Eisenhower matrix"
echo "    /app/s/goals      — Goal tracking"
echo "    /app/s/brain-dump — Quick capture"
echo "    /app/s/inbox      — Agent inbox"
echo ""
echo "  Terminal remote control:"
echo "    mc today"
echo "    mc tasks matrix"
echo "    mc brain add \"idea\""
echo ""
echo -e "${Y}  ── MANUAL STEPS STILL NEEDED ──${B}"
echo ""
echo "  1. Restart Mission Control:"
echo "     cd $MC && npm run dev"
echo "     (or: pm2 restart all)"
echo ""
echo "  2. Add nav links to your layout — see below"
echo ""
echo "  3. Enable SSH (for mc from phone):"
echo "     System Settings → General → Sharing → Remote Login: ON"
echo ""
echo "  ── NAV LINKS to add to your sidebar ──"
echo ""
cat << 'NAVEOF'
  // Add this block inside your navigation component (layout.tsx or sidebar):

  // Mission Control
  <NavLink href="/app/s/dashboard">Dashboard</NavLink>
  <NavLink href="/app/s/today">Today</NavLink>
  <NavLink href="/app/s/tasks">Tasks</NavLink>
  <NavLink href="/app/s/goals">Goals</NavLink>
  <NavLink href="/app/s/brain-dump">Brain Dump</NavLink>
  <NavLink href="/app/s/inbox">Inbox</NavLink>
NAVEOF
echo ""
