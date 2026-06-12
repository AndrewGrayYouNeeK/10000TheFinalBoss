#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Stopping old servers on 4173/5173..."
for port in 4173 5173; do
  lsof -ti :"$port" | xargs kill -9 2>/dev/null || true
done

echo "→ Building..."
npm run build

echo "→ Starting at http://127.0.0.1:4173"
echo "   Shop:         http://127.0.0.1:4173/shop"
echo "   Sound lab:    http://127.0.0.1:4173/sfx-preview"
echo ""
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort --open
