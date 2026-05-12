#!/usr/bin/env bash
set -euo pipefail

# Usage:
# OUTDIR=/path/to/out LOCAL_REPOS_DIR=/path/to/local/clones ./scripts/get-repo-metrics.sh [repos-file]
# If LOCAL_REPOS_DIR is provided, local clones for large repos should be placed there
# using the name format owner--repo (e.g. torvalds--linux).

OUTDIR=${OUTDIR:-/tmp/git-visualize-metrics}
LOCAL_REPOS_DIR=${LOCAL_REPOS_DIR:-}
REPOS_FILE=${1:-$(dirname "$0")/repos.txt}
mkdir -p "$OUTDIR"

# Repos considered large that should be provided locally if you want them processed
LARGE_REPOS=(
  "torvalds/linux"
  "kubernetes/kubernetes"
  "rust-lang/rust"
  "python/cpython"
  "golang/go"
  "git/git"
  "systemd/systemd"
)

is_large() {
  local r="$1"
  for lr in "${LARGE_REPOS[@]}"; do
    if [[ "$lr" == "$r" ]]; then
      return 0
    fi
  done
  return 1
}

run_metrics() {
  local repo_arg="$1"
  local out="$2"
  if npx tsx packages/git-visualize/src/index.ts repo-metrics "$repo_arg" -o "$out" --pretty; then
    return 0
  fi
  return 1
}

while IFS= read -r repo || [ -n "$repo" ]; do
  repo=${repo%%#*}
  repo=${repo%%[[:space:]]}
  repo=${repo##[[:space:]]}
  [ -z "$repo" ] && continue

  owner=$(echo "$repo" | cut -d/ -f1)
  name=$(echo "$repo" | cut -d/ -f2)
  out="$OUTDIR/${owner}--${name}.json"
  repo_url="https://github.com/${repo}"

  echo "=== Processing $repo ==="
  if [ -f "$out" ]; then
    echo "  Skipping; $out already exists"
    continue
  fi

  if is_large "$repo"; then
    if [ -n "$LOCAL_REPOS_DIR" ] && [ -d "$LOCAL_REPOS_DIR/${owner}--${name}" ]; then
      echo "  Large repo: using local clone $LOCAL_REPOS_DIR/${owner}--${name}"
      if run_metrics "$LOCAL_REPOS_DIR/${owner}--${name}" "$out"; then
        echo "  OK (local)"
      else
        echo "  repo-metrics failed for local clone"
      fi
    else
      echo "  Skipping large repo $repo (no local clone). To process, set LOCAL_REPOS_DIR and place a clone at LOCAL_REPOS_DIR/${owner}--${name}"
    fi
    continue
  fi

  # Try remote fast path (isomorphic-git into temp dir)
  if run_metrics "$repo_url" "$out"; then
    echo "  OK (remote)"
    continue
  fi

  # Fallback to native shallow clone
  dest="$OUTDIR/repos/${owner}--${name}"
  mkdir -p "$(dirname "$dest")"
  echo "  Remote processing failed; attempting shallow native clone to $dest"
  if git clone --shallow-since="90 days ago" "$repo_url" "$dest"; then
    if run_metrics "$dest" "$out"; then
      echo "  OK (native)"
    else
      echo "  repo-metrics failed for $dest"
    fi
  else
    echo "  git clone failed for $repo_url"
  fi

done < "$REPOS_FILE"

echo "=== Done. Outputs in $OUTDIR ==="
