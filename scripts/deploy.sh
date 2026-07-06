#!/usr/bin/env bash
# The deploy ritual, committed so the last mile is as inspectable as the rest.
# Requires: wrangler login with access to the Cloudflare Pages project.
#
# A deploy only counts when the live domain provably serves the deployed
# commit: every build emits version.json (commit, data version, package
# version), and this script fails unless https://criticalwindow.org returns
# the commit it just shipped.
set -euo pipefail

[ "$(git branch --show-current)" = "main" ] || { echo "deploy from main only" >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "working tree not clean" >&2; exit 1; }

# Every commit hash cited in the balance history must exist on origin/main;
# date-normalized publishing can orphan local hashes, and citations to
# unpublished commits are dead links waiting to be found.
git fetch -q origin main
for h in $(grep -rhoE '\b[0-9a-f]{7}\b' docs/BALANCE.md | sort -u); do
  git merge-base --is-ancestor "$h" origin/main 2>/dev/null \
    || { echo "docs/BALANCE.md cites $h, not on origin/main" >&2; exit 1; }
done

pnpm validate && pnpm test && pnpm build

npx wrangler pages deploy dist --branch=main --project-name=criticalwindow --commit-dirty=false

LOCAL="$(git rev-parse --short HEAD)"
for i in 1 2 3 4 5 6; do
  sleep 5
  LIVE="$(curl -fsSL "https://criticalwindow.org/version.json?cb=$RANDOM$i" 2>/dev/null | sed -n 's/.*"commit": "\([^"]*\)".*/\1/p')"
  [ "$LIVE" = "$LOCAL" ] && { echo "live serves $LIVE (matches HEAD)"; exit 0; }
done
echo "live serves '$LIVE' but HEAD is '$LOCAL'; purge the zone cache and re-check" >&2
exit 1
