#!/usr/bin/env bash
# Mission Control CLI setup
# Run from the directory containing mc.js

set -e

echo ""
echo "  ✦ Mission Control CLI Setup"
echo "  ─────────────────────────────"

# Detect MC app
MC_DIR="$HOME/golden-claw/mission-control"
if [ -d "$MC_DIR" ]; then
  echo "  ✓ Found Mission Control at: $MC_DIR"
else
  echo "  ⚠  Mission Control not found at $MC_DIR"
  echo "     Set MC_HOST env var to point to your API:"
  echo "     export MC_HOST=http://localhost:3002"
fi

# Node version check
NODE_VER=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "old")
if [ "$NODE_VER" = "old" ]; then
  echo "  ⚠  Node.js 18+ required. Current: $(node --version)"
  exit 1
fi
echo "  ✓ Node.js $(node --version)"

# Install dependencies
echo ""
echo "  Installing dependencies…"
npm install --silent

# Make executable
chmod +x mc.js

# Create symlink so you can run `mc` directly
LINK_DIR="/usr/local/bin"
if [ -w "$LINK_DIR" ]; then
  ln -sf "$(pwd)/mc.js" "$LINK_DIR/mc"
  echo "  ✓ Installed as: mc (global command)"
else
  # Try ~/bin
  mkdir -p "$HOME/bin"
  ln -sf "$(pwd)/mc.js" "$HOME/bin/mc"
  echo "  ✓ Installed to ~/bin/mc"
  echo "     Add ~/bin to PATH if not already:"
  echo "     export PATH=\"\$HOME/bin:\$PATH\""
fi

echo ""
echo "  Setup complete. Try:"
echo "    mc today"
echo "    mc tasks matrix"
echo "    mc brain add \"first idea\""
echo ""
echo "  For remote access via SSH:"
echo "    1. Enable Remote Login in macOS System Settings → General → Sharing"
echo "    2. Connect via Termius or any SSH client:"
echo "       ssh marinajaubert@192.168.0.108"
echo "    3. Then run: mc today"
echo ""

# Optional: run db migration
if [ -f "$MC_DIR/crm.db" ]; then
  read -rp "  Run database migration now? (y/N): " MIGRATE
  if [[ "$MIGRATE" =~ ^[Yy]$ ]]; then
    echo "  Running migration…"
    sqlite3 "$MC_DIR/crm.db" < integration/db-migration.sql && echo "  ✓ Migration complete." || echo "  ⚠  Some columns may already exist — that is OK."
  fi
fi
