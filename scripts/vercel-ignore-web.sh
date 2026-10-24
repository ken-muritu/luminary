#!/usr/bin/env bash
# Exit 0 = skip Vercel build, exit 1 = run build.
# Used as ignoreCommand for luminarysite (project root: repo root).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREV="${VERCEL_GIT_PREVIOUS_SHA:-}"
CURR="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

PATHS=(apps/web vercel.json)

if [[ -z "$PREV" ]]; then
  exit 1
fi

if git -C "$ROOT" diff --quiet "$PREV" "$CURR" -- "${PATHS[@]}"; then
  exit 0
fi

exit 1
