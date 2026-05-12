"""
Generates mc-master.sh — a fully self-contained install script.
Run: python3 build-master.py
"""
import base64, os

ROOT = "/home/user/ascend-bali"

files = {
    "mc.js":                    f"{ROOT}/mc.js",
    "goals-collection.ts":      f"{ROOT}/integration/api-routes/goals-collection.ts",
    "goals-id.ts":              f"{ROOT}/integration/api-routes/goals-id.ts",
    "brain-dump-collection.ts": f"{ROOT}/integration/api-routes/brain-dump-collection.ts",
    "brain-dump-id.ts":         f"{ROOT}/integration/api-routes/brain-dump-id.ts",
    "inbox-collection.ts":      f"{ROOT}/integration/api-routes/inbox-collection.ts",
    "inbox-id.ts":              f"{ROOT}/integration/api-routes/inbox-id.ts",
    "today.ts":                 f"{ROOT}/integration/api-routes/today.ts",
    "s-dashboard.tsx":          f"{ROOT}/integration/app-routes/s-dashboard-page.tsx",
    "s-today.tsx":              f"{ROOT}/integration/app-routes/s-today-page.tsx",
    "s-tasks.tsx":              f"{ROOT}/integration/app-routes/s-tasks-page.tsx",
    "s-goals.tsx":              f"{ROOT}/integration/app-routes/s-goals-page.tsx",
    "s-brain-dump.tsx":         f"{ROOT}/integration/app-routes/s-brain-dump-page.tsx",
    "s-inbox.tsx":              f"{ROOT}/integration/app-routes/s-inbox-page.tsx",
}

# Also base64-encode the migration script itself so it embeds cleanly
migration_py = """
import sqlite3, os, sys, glob
mc      = sys.argv[1]
matches = glob.glob(f"{mc}/**/*.db", recursive=True) + glob.glob(f"{mc}/*.db")
db_path = next((p for p in matches if os.path.basename(p) == "crm.db"), None)
if not db_path:
    print("  crm.db not found — skipping migration"); sys.exit(0)
print(f"  DB: {db_path}")
conn = sqlite3.connect(db_path)
cur  = conn.cursor()

def has_col(t, c):
    try:
        cur.execute(f"SELECT {c} FROM {t} LIMIT 0"); return True
    except: return False

for col, defn in [
    ("quadrant","TEXT DEFAULT NULL"), ("goal_id","INTEGER DEFAULT NULL"),
    ("revenue_score","INTEGER DEFAULT 3"), ("cost_tokens","INTEGER DEFAULT NULL")]:
    if not has_col("tasks", col):
        cur.execute(f"ALTER TABLE tasks ADD COLUMN {col} {defn}"); print(f"  + tasks.{col}")
    else: print(f"  ok tasks.{col}")

for col, defn in [
    ("instructions","TEXT DEFAULT NULL"), ("capabilities","TEXT DEFAULT NULL"),
    ("skill_ids","TEXT DEFAULT NULL")]:
    if not has_col("agents", col):
        cur.execute(f"ALTER TABLE agents ADD COLUMN {col} {defn}"); print(f"  + agents.{col}")
    else: print(f"  ok agents.{col}")

sql = [
    "CREATE TABLE IF NOT EXISTS mc_goals (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'outcome', timeframe TEXT, parent_goal_id INTEGER REFERENCES mc_goals(id), project_id INTEGER, status TEXT NOT NULL DEFAULT 'active', notes TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), deleted_at TEXT DEFAULT NULL)",
    "CREATE TABLE IF NOT EXISTS mc_goal_milestones (id INTEGER PRIMARY KEY AUTOINCREMENT, goal_id INTEGER NOT NULL REFERENCES mc_goals(id) ON DELETE CASCADE, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0, due_date TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))",
    "CREATE TABLE IF NOT EXISTS mc_brain_dump (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL, captured_at TEXT NOT NULL DEFAULT (datetime('now')), processed INTEGER NOT NULL DEFAULT 0, converted_to TEXT DEFAULT NULL, tags TEXT DEFAULT NULL)",
    "CREATE TABLE IF NOT EXISTS mc_inbox (id INTEGER PRIMARY KEY AUTOINCREMENT, from_agent TEXT NOT NULL DEFAULT 'system', to_agent TEXT NOT NULL DEFAULT 'me', type TEXT NOT NULL DEFAULT 'report', task_id INTEGER DEFAULT NULL, subject TEXT NOT NULL, body TEXT, status TEXT NOT NULL DEFAULT 'unread', created_at TEXT NOT NULL DEFAULT (datetime('now')), read_at TEXT DEFAULT NULL)",
    "CREATE TABLE IF NOT EXISTS mc_skills_library (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, description TEXT, content TEXT, tags TEXT DEFAULT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))",
    "CREATE INDEX IF NOT EXISTS idx_tasks_quadrant      ON tasks(quadrant)",
    "CREATE INDEX IF NOT EXISTS idx_tasks_revenue_score ON tasks(revenue_score)",
    "CREATE INDEX IF NOT EXISTS idx_mc_brain_dump_proc  ON mc_brain_dump(processed)",
    "CREATE INDEX IF NOT EXISTS idx_mc_inbox_status     ON mc_inbox(status)",
    "CREATE INDEX IF NOT EXISTS idx_mc_goals_status     ON mc_goals(status)",
]
for s in sql:
    try: cur.execute(s)
    except Exception as e: print(f"  warn: {e}")

conn.commit(); conn.close()
print("  migration complete")
"""

# Also base64-encode the file-unpack script
files["_migrate.py"] = None   # sentinel — handled separately

encoded = {}
for key, path in files.items():
    if path is None:
        encoded[key] = base64.b64encode(migration_py.encode("utf-8")).decode()
    else:
        with open(path, "rb") as f:
            encoded[key] = base64.b64encode(f.read()).decode()

# Build inline Python that decodes and writes all files
py_lines = [
    "import base64, sys, os",
    "out = sys.argv[1]",
    "os.makedirs(out, exist_ok=True)",
    "files = {",
]
for key, val in encoded.items():
    py_lines.append(f'    "{key}": "{val}",')
py_lines += [
    "}",
    "for name, data in files.items():",
    "    p = os.path.join(out, name)",
    "    with open(p, 'wb') as f: f.write(base64.b64decode(data))",
    "print(f'  Wrote {len(files)} files to {out}')",
]
py_block = "\n".join(py_lines)

script = f"""#!/usr/bin/env bash
# ================================================================
#  mc-master.sh — Mission Control: Complete Self-Contained Install
#
#  USAGE (one command, no internet, no git needed):
#    bash mc-master.sh
#
#  Requires only: bash · node 18+ · npm · python3
#  Auto-detects app/ or src/app/, SQLite or JSON storage.
# ================================================================
set -e

MC="${{MC_DIR:-$HOME/golden-claw/mission-control}}"
MCLI="$HOME/golden-claw/mc-cli"

G='\\033[0;32m'; Y='\\033[0;33m'; DIM='\\033[2m'; B='\\033[0m'
ok()  {{ echo -e "${{G}}  ✓ $*${{B}}"; }}
hdr() {{ echo -e "\\n${{Y}}── $* ${{B}}"; }}
err() {{ echo -e "\\033[0;31m  ✗ $*${{B}}"; exit 1; }}
warn(){{ echo -e "${{Y}}  ⚠  $*${{B}}"; }}
info(){{ echo -e "  $*"; }}

echo ""
echo -e "${{Y}}  ✦ Mission Control — Full Install${{B}}"
echo "  ══════════════════════════════════════"

# 1. Checks
hdr "1. Checks"
[ -d "$MC" ] || err "Not found: $MC  |  Set: MC_DIR=/your/path bash mc-master.sh"
command -v node    >/dev/null || err "node not found — install Node.js 18+"
command -v python3 >/dev/null || err "python3 not found"

# Auto-detect app directory — use MC_APP_DIR if set by deploy.sh, else probe
if [ -n "${{MC_APP_DIR}}" ]; then
  SRC="${{MC_APP_DIR}}"
elif [ -d "$MC/src/app" ]; then
  SRC="$MC/src/app"
elif [ -d "$MC/app" ]; then
  SRC="$MC/app"
else
  err "Cannot find Next.js app directory in $MC (checked app/ and src/app/)"
fi

ok "Mission Control at $MC"
ok "App directory:   $SRC"

# 2. Backup
hdr "2. Backup"
BAK="$MC.backup.$(date +%Y%m%d_%H%M%S)"
cp -r "$MC" "$BAK"
ok "Backup → $BAK"

# 3. Write all embedded files
hdr "3. Extracting files"
python3 - "$MCLI" << 'PYEOF'
{py_block}
PYEOF

# 4. Install mc CLI
hdr "4. mc CLI"
chmod +x "$MCLI/mc.js"
cd "$MCLI"
npm install --silent 2>/dev/null
mkdir -p "$HOME/bin"
ln -sf "$MCLI/mc.js" "$HOME/bin/mc"
export PATH="$HOME/bin:$PATH"
for RC in "$HOME/.zshrc" "$HOME/.bashrc"; do
  [ -f "$RC" ] && ! grep -q 'HOME/bin' "$RC" 2>/dev/null && echo 'export PATH="$HOME/bin:$PATH"' >> "$RC" || true
done
ok "mc installed — try: mc today"

# 5. Database migration (only if crm.db exists — skipped for JSON-based apps)
hdr "5. Database migration"
DB_PATH=$(find "$MC" -maxdepth 3 -name "crm.db" 2>/dev/null | grep -v sample | head -1 || true)
if [ -n "$DB_PATH" ]; then
  python3 "$MCLI/_migrate.py" "$MC"
  ok "Database migrated"
else
  info "No crm.db found — app uses JSON storage, skipping SQLite migration"
  ok "Skipped (not needed)"
fi

# 6. Pages → /app/s
hdr "6. Pages"
mkdir -p "$SRC/s/dashboard" "$SRC/s/today" "$SRC/s/tasks" \\
          "$SRC/s/goals"    "$SRC/s/brain-dump" "$SRC/s/inbox"
cp "$MCLI/s-dashboard.tsx"  "$SRC/s/dashboard/page.tsx"
cp "$MCLI/s-today.tsx"      "$SRC/s/today/page.tsx"
cp "$MCLI/s-tasks.tsx"      "$SRC/s/tasks/page.tsx"
cp "$MCLI/s-goals.tsx"      "$SRC/s/goals/page.tsx"
cp "$MCLI/s-brain-dump.tsx" "$SRC/s/brain-dump/page.tsx"
cp "$MCLI/s-inbox.tsx"      "$SRC/s/inbox/page.tsx"
ok "Pages written to $SRC/s/"

# 7. API routes (only write if they don't already exist)
hdr "7. API routes"
write_route() {{
  local dest="$1" src="$2"
  if [ -f "$dest" ]; then
    info "exists — skipping $dest"
  else
    mkdir -p "$(dirname "$dest")"
    cp "$src" "$dest"
    info "wrote $dest"
  fi
}}
write_route "$SRC/api/goals/route.ts"             "$MCLI/goals-collection.ts"
write_route "$SRC/api/goals/[id]/route.ts"        "$MCLI/goals-id.ts"
write_route "$SRC/api/brain-dump/route.ts"        "$MCLI/brain-dump-collection.ts"
write_route "$SRC/api/brain-dump/[id]/route.ts"   "$MCLI/brain-dump-id.ts"
write_route "$SRC/api/inbox/route.ts"             "$MCLI/inbox-collection.ts"
write_route "$SRC/api/inbox/[id]/route.ts"        "$MCLI/inbox-id.ts"
write_route "$SRC/api/today/route.ts"             "$MCLI/today.ts"
ok "API routes done"

# 8. Type check
hdr "8. Type check"
cd "$MC"
TSC=$(npx tsc --noEmit 2>&1 || true)
if echo "$TSC" | grep -q "error TS"; then
  warn "Type errors present — review before deploying:"
  echo "$TSC" | grep "error TS" | head -10
else
  ok "Type check passed"
fi

# Done
echo ""
echo -e "${{Y}}  ══════════════════════════════════════${{B}}"
echo -e "${{Y}}  ✦ Integration done.${{B}}"
echo ""
echo -e "  ${{G}}Restart server:${{B}}  cd $MC && npm run dev"
echo ""
echo -e "  ${{G}}Add to sidebar (layout.tsx or nav component):${{B}}"
echo '     <NavLink href="/app/s/dashboard">Dashboard</NavLink>'
echo '     <NavLink href="/app/s/today">Today</NavLink>'
echo '     <NavLink href="/app/s/tasks">Tasks</NavLink>'
echo '     <NavLink href="/app/s/goals">Goals</NavLink>'
echo '     <NavLink href="/app/s/brain-dump">Brain Dump</NavLink>'
echo '     <NavLink href="/app/s/inbox">Inbox</NavLink>'
echo ""
"""

out = "/home/user/ascend-bali/mc-master.sh"
with open(out, "w") as f:
    f.write(script)
os.chmod(out, 0o755)
size_kb = os.path.getsize(out) / 1024
print(f"Generated {out}  ({size_kb:.0f} KB)")
