#!/usr/bin/env bash
# Tracked secret paths (contracts/build-and-ci.md §Helper scripts, SEC-007, R-18). Requires .gitignore
# to hold the .env and key patterns, and fails on any tracked file that is a secret by its name:
# *.enc.yaml, key and certificate files, .env files, anything under a secrets/ folder.
set -euo pipefail

fail=0
report() {
  echo "check-tracked-secrets: $1" >&2
  fail=1
}

if [[ ! -f .gitignore ]]; then
  report ".gitignore is missing"
else
  grep -qxF '.env*' .gitignore || report ".gitignore does not ignore .env*"
  grep -qxF '*.key' .gitignore || report ".gitignore does not ignore *.key"
fi

while IFS= read -r -d '' path; do
  base="${path##*/}"
  case "$base" in
    *.enc.yaml) report "tracked encrypted file: $path" ;;
    *.key|*.crt|*.cer|*.der|*.pem|*.p12|*.pfx|*.mobileconfig) report "tracked key or certificate: $path" ;;
    .env*) report "tracked environment file: $path" ;;
  esac
  case "/$path" in
    */secrets/*) report "tracked file under secrets/: $path" ;;
  esac
done < <(git ls-files -z)

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi
echo "check-tracked-secrets: no tracked secret path"
