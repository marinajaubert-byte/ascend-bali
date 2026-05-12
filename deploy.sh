#!/usr/bin/env bash
# ================================================================
#  deploy.sh — Mission Control: Install + Build + Deploy
#
#  One command does everything:
#    bash deploy.sh
#
#  What it does:
#    1. Runs the full integration (mc-master.sh)
#    2. Installs npm dependencies
#    3. Runs next build
#    4. Deploys to Vercel production
# ================================================================
set -e

MC="${MC_DIR:-$HOME/golden-claw/mission-control}"
REPO="https://raw.githubusercontent.com/marinajaubert-byte/ascend-bali/claude/terminal-remote-control-X6CZn"

G='\033[0;32m'; Y='\033[0;33m'; B='\033[0m'
ok()  { echo -e "${G}  ✓ $*${B}"; }
hdr() { echo -e "\n${Y}── $* ${B}"; }
err() { echo -e "\033[0;31m  ✗ $*${B}"; exit 1; }

echo ""
echo -e "${Y}  ✦ Mission Control — Install + Build + Deploy${B}"
echo "  ══════════════════════════════════════════════"

# ── 1. Checks ────────────────────────────────────────────────
hdr "1. Checks"
[ -d "$MC" ]          || err "Mission Control not found at $MC\n     Set: MC_DIR=/your/path bash deploy.sh"
[ -d "$MC/src/app" ]  || err "No src/app in $MC — wrong folder?"
command -v node    >/dev/null || err "node not found — install Node.js 18+"
command -v python3 >/dev/null || err "python3 not found"
command -v npm     >/dev/null || err "npm not found"
ok "Mission Control at $MC"

# ── 2. Integration (mc-master.sh) ───────────────────────────
hdr "2. Running integration"
MASTER="$HOME/mc-master.sh"
if [ ! -f "$MASTER" ]; then
  echo "  Downloading mc-master.sh..."
  curl -fsSL "$REPO/mc-master.sh" -o "$MASTER"
fi
bash "$MASTER"

# ── 3. Install dependencies ──────────────────────────────────
hdr "3. npm install"
cd "$MC"
npm install
ok "Dependencies installed"

# ── 4. Build ─────────────────────────────────────────────────
hdr "4. next build"
npm run build
ok "Build succeeded"

# ── 5. Deploy ────────────────────────────────────────────────
hdr "5. Deploying to Vercel"
if ! command -v vercel >/dev/null 2>&1; then
  echo "  Installing Vercel CLI..."
  npm install -g vercel --silent
fi
vercel --prod --yes
echo ""
ok "Deployed to production"

echo ""
echo -e "${Y}  ✦ Done! Mission Control is live.${B}"
echo ""
echo "  Domain:  ascendtobali.com"
echo "  Test mc: mc today"
echo ""
