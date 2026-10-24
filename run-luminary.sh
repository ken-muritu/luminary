#!/bin/bash
# Luminary launcher for Linux (dev preview)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! curl -sf http://localhost:5173/ >/dev/null 2>&1; then
  echo "Starting Vite renderer on :5173..."
  npm run dev:renderer &
  sleep 2
fi

npm run build --workspace=apps/main
env -u ELECTRON_RUN_AS_NODE NODE_ENV=development ./node_modules/.bin/electron .
