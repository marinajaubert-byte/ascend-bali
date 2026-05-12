#!/usr/bin/env bash
# ================================================================
#  deploy.sh — Mission Control: Install + Build + Deploy
#
#  USAGE:
#    bash deploy.sh
#
#  Auto-detects app structure (app/ or src/app/, SQLite or JSON).
# ================================================================
set -e

MC="${MC_DIR:-$HOME/golden-claw/mission-control}"
REPO="https://raw.githubusercontent.com/marinajaubert-byte/ascend-bali/claude/terminal-remote-control-X6CZn"

G='\033[0;32m'; Y='\033[0;33m'; B='\033[0m'
ok()   { echo -e "${G}  ✓ $*${B}"; }
hdr()  { echo -e "\n${Y}── $* ${B}"; }
err()  { echo -e "\033[0;31m  ✗ $*${B}"; exit 1; }
info() { echo -e "  $*"; }

echo ""
echo -e "${Y}  ✦ Mission Control — Install + Build + Deploy${B}"
echo "  ══════════════════════════════════════════════"

# ── 1. Checks ────────────────────────────────────────────────
hdr "1. Checks"
[ -d "$MC" ] || err "Mission Control not found at $MC\n     Set: MC_DIR=/your/path bash deploy.sh"
command -v node    >/dev/null || err "node not found — install Node.js 18+"
command -v python3 >/dev/null || err "python3 not found"
command -v npm     >/dev/null || err "npm not found"

# Auto-detect app directory (app/ or src/app/)
if   [ -d "$MC/src/app" ]; then  APP_DIR="$MC/src/app"
elif [ -d "$MC/app" ];     then  APP_DIR="$MC/app"
else err "Cannot find app directory in $MC (checked app/ and src/app/)"; fi

# Auto-detect data storage (SQLite or JSON)
DB_PATH=$(find "$MC" -maxdepth 3 -name "crm.db" 2>/dev/null | head -1)
if [ -n "$DB_PATH" ]; then STORAGE="sqlite"; else STORAGE="json"; fi

ok "Mission Control at $MC"
ok "App directory:   $APP_DIR"
ok "Data storage:    $STORAGE"

export MC APP_DIR STORAGE DB_PATH

# ── 2. Integration ───────────────────────────────────────────
hdr "2. Integration (mc CLI + pages + API routes)"
MASTER="$HOME/mc-master.sh"
if [ ! -f "$MASTER" ]; then
  info "Downloading mc-master.sh..."
  curl -fsSL "$REPO/mc-master.sh" -o "$MASTER"
fi

# Pass detected paths into mc-master.sh via env
MC_APP_DIR="$APP_DIR" MC_STORAGE="$STORAGE" bash "$MASTER"

# ── 3. npm install ───────────────────────────────────────────
hdr "3. npm install"
cd "$MC"
npm install --legacy-peer-deps
ok "Dependencies installed"

# ── 4. Build ─────────────────────────────────────────────────
hdr "4. next build"
npm run build
ok "Build succeeded"

# ── 5. Deploy ────────────────────────────────────────────────
hdr "5. Deploying to Vercel"
if ! command -v vercel >/dev/null 2>&1; then
  info "Installing Vercel CLI..."
  npm install -g vercel --silent
fi
cd "$MC"
vercel --prod --yes
ok "Deployed to production"

echo ""
echo -e "${Y}  ✦ Done! Mission Control is live at ascendtobali.com${B}"
echo ""
info "Test your CLI:  mc today"
info "Open browser:   https://ascendtobali.com/app/s/dashboard"
echo ""
