#!/usr/bin/env bash
# Exit 0 = skip Vercel build, exit 1 = run build.
# Used as ignoreCommand for luminary-app (project root: apps/pwa).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
CURR="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

PATHS=(
  src
  public
  index.html
  vite.config.ts
  package.json
  pnpm-lock.yaml
  scripts/generate-icons.cjs
  scripts/generate-bible-sql.cjs
  public/bible-data
  vercel.app.json
  apps/pwa
  legacy/v2/main/assets/bible
)

if [[ -z "$PREV" ]]; then
  # First deploy or no previous SHA — always build.
  exit 1
fi

if git -C "$ROOT" diff --quiet "$PREV" "$CURR" -- "${PATHS[@]}"; then
  exit 0
fi

exit 1
