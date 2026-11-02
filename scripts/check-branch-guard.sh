#!/usr/bin/env bash
# Branch guard (contracts/build-and-ci.md §Helper scripts, R-18). A pull request into main may come
# only from release/X.Y.Z or hotfix/X.Y.Z. Other bases pass as not applicable. The head name is
# checked as text, never evaluated or used as a format string.
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: check-branch-guard.sh BASE HEAD" >&2
  exit 2
fi

base="$1"
head="$2"

if [[ "$base" != "main" ]]; then
  printf 'branch guard: not applicable (base %s)\n' "$base"
  exit 0
fi

pattern='^(release|hotfix)/(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$'
if [[ "$head" =~ $pattern ]]; then
  printf 'branch guard: %s is a release or hotfix name (the name is checked, not the content)\n' "$head"
  exit 0
fi

# Render the head safely: anything outside a plain set of characters is shown as '?'.
shown="$(printf '%s' "$head" | LC_ALL=C tr -c 'A-Za-z0-9/._-' '?')"
printf 'branch guard: %s may not merge into main; the head must be release/X.Y.Z or hotfix/X.Y.Z\n' "$shown" >&2
exit 1
