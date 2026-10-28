#!/usr/bin/env bash
# Runs every game's tests against the toolbox in this folder (not the live one), so a toolbox
# change is only published when every game still works. Run from anywhere:
#   bash tools/test-all.sh
# The games are expected next to the hub folder (Game_Hub/arrowhead, Game_Hub/love-to-color...).
set -u
hub="$(cd "$(dirname "$0")/.." && pwd)"
games="$(dirname "$hub")"
export HUB_DIR="$hub" SHARED_DIR="$hub/shared/v1"
failed=()

run() { # name, folder, command
  echo
  echo "=== $1"
  if [ ! -d "$2" ]; then
    echo "missing: $2"
    failed+=("$1 (missing)")
    return
  fi
  (cd "$2" && bash -c "$3") || failed+=("$1")
}

run 'GameHub, Calm Bubbles, Melody Garden' "$hub" 'npm test'
run 'Arrowhead' "$games/arrowhead" 'npm test'
run 'Love To Color' "$games/love-to-color" 'npm test'
# Quiet Words copies the toolbox into its build, so it's built fresh against this one.
run 'Quiet Words' "$games/quiet-words" 'npm test && npx playwright test'
# Momahjong has level checks only, until it gets browser tests (contract rule 11).
run 'Momahjong (levels only)' "$games/momahjong" 'node build/check-levels.mjs'

echo
if [ ${#failed[@]} -eq 0 ]; then
  echo "Every game passed. The hub can be pushed."
else
  echo "Not safe to push the hub. Failed: ${failed[*]}"
  exit 1
fi
