#!/usr/bin/env bash
# Create or reuse a slice worktree from the frozen base. Never merges into the base.
set -euo pipefail
SWARM="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SWARM/.." && pwd)"
ID="${1:-}"
if [ -z "$ID" ]; then
  echo "usage: .test-swarm/claim-slice.sh <id>" >&2
  exit 2
fi
if [ ! -f "$SWARM/units.tsv" ] || [ ! -f "$SWARM/config" ]; then
  echo "missing $SWARM/units.tsv or config" >&2
  exit 2
fi
BASE="$(awk -F= '/^BASE=/{print $2; exit}' "$SWARM/config")"
if [ -z "$BASE" ]; then
  echo "missing BASE in $SWARM/config" >&2
  exit 2
fi
line="$(awk -F'\t' -v id="$ID" 'NR>1 && $1==id {print; exit}' "$SWARM/units.tsv")"
if [ -z "$line" ]; then
  echo "unknown id $ID" >&2
  exit 2
fi
branch="$(printf '%s\n' "$line" | awk -F'\t' '{print $3}')"
worktree="$(printf '%s\n' "$line" | awk -F'\t' '{print $4}')"
cd "$ROOT"
if [ "${worktree#/}" != "$worktree" ]; then
  parent="$(dirname "$worktree")"
  mkdir -p "$parent"
  wt="$(cd "$parent" && pwd)/$(basename "$worktree")"
else
  parent="$(dirname "$ROOT/$worktree")"
  mkdir -p "$parent"
  wt="$(cd "$parent" && pwd)/$(basename "$worktree")"
fi
start_ref="$BASE"
if ! git show-ref --verify --quiet "refs/heads/$BASE" && ! git rev-parse --verify --quiet "$BASE^{commit}" >/dev/null; then
  if git show-ref --verify --quiet "refs/remotes/origin/$BASE"; then
    start_ref="origin/$BASE"
  else
    git fetch origin "$BASE" --depth 1 2>/dev/null || true
    if git show-ref --verify --quiet "refs/remotes/origin/$BASE"; then
      start_ref="origin/$BASE"
    fi
  fi
fi
if [ -e "$wt/.git" ] || [ -f "$wt/.git" ]; then
  if [ -z "$(git -C "$wt" status --porcelain)" ] && [ "$(git -C "$wt" rev-list --count "$start_ref"..HEAD 2>/dev/null || echo 1)" = "0" ]; then
    git -C "$wt" merge --ff-only "$start_ref"
  fi
  mkdir -p "$wt/.test-swarm"
  cp -R "$SWARM/." "$wt/.test-swarm/"
  echo "using $wt ($branch)"
  exit 0
fi
if git show-ref --verify --quiet "refs/heads/$branch"; then
  git worktree add "$wt" "$branch"
else
  git worktree add -b "$branch" "$wt" "$start_ref"
fi
if [ -d "$ROOT/node_modules" ]; then
  ln -sfn "$ROOT/node_modules" "$wt/node_modules"
fi
mkdir -p "$wt/.test-swarm"
cp -R "$SWARM/." "$wt/.test-swarm/"
chmod +x "$wt/.test-swarm/claim-slice.sh"
echo "claimed $ID -> $wt"
