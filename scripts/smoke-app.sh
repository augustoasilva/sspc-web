#!/usr/bin/env bash
# Smoke test of the app image (contracts/http-serving.md §Smoke assertions, 1 to 10).
# Runs the image under the stack's restrictions, checks each assertion and stops at the first
# failure, naming it. Usage: scripts/smoke-app.sh IMAGE
# Environment: APP_VERSION (default 0.0.0+dev), SMOKE_PORT (default: a free loopback port).
set -euo pipefail

IMAGE="${1:?usage: scripts/smoke-app.sh IMAGE}"
APP_VERSION="${APP_VERSION:-0.0.0+dev}"
NAME="sspc-smoke-app-$$"
WORK="$(mktemp -d)"
CSP="default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"

cleanup() {
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

pass() {
  echo "ok: $1"
}

docker run -d --name "$NAME" --user 65532:65532 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges:true \
  -p "127.0.0.1:${SMOKE_PORT:-0}:8080" "$IMAGE" >/dev/null

PORT="$(docker port "$NAME" 8080/tcp | head -n1 | sed 's/.*://')"
BASE="http://127.0.0.1:${PORT}"

# Waits until the app answers, so the first request is not a start-up race.
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null "$BASE/" 2>/dev/null; then break; fi
  sleep 0.5
done

# status_of PATH: prints the HTTP status. headers_of PATH: prints the response headers.
status_of() { curl -s -o /dev/null -w '%{http_code}' "$BASE$1"; }
headers_of() { curl -s -D - -o /dev/null "$BASE$1" | tr -d '\r'; }
header_of() { headers_of "$1" | grep -i "^$2:" | head -n1 | sed -E "s/^[^:]*:[[:space:]]*//"; }

# 1. GET / is 200 text/html with <sspc-root>, no onload= and no inline script.
[[ "$(status_of /)" == 200 ]] || fail "1: GET / is not 200"
curl -s "$BASE/" -o "$WORK/index.html"
grep -q '<sspc-root' "$WORK/index.html" || fail "1: GET / has no <sspc-root>"
grep -qi 'onload=' "$WORK/index.html" && fail "1: GET / has an onload= attribute"
if grep -Eo '<script[^>]*>' "$WORK/index.html" | grep -qv 'src='; then fail "1: GET / has an inline script"; fi
header_of / content-type | grep -q 'text/html' || fail "1: GET / is not text/html"
pass "1 index is the shell"

# 2. GET /sobre is 200 with the same body as /, both no-cache.
[[ "$(status_of /sobre)" == 200 ]] || fail "2: GET /sobre is not 200"
curl -s "$BASE/sobre" -o "$WORK/sobre.html"
cmp -s "$WORK/index.html" "$WORK/sobre.html" || fail "2: GET /sobre body differs from /"
[[ "$(header_of /sobre cache-control)" == "no-cache" ]] || fail "2: /sobre is not no-cache"
[[ "$(header_of / cache-control)" == "no-cache" ]] || fail "2: / is not no-cache"
pass "2 SPA fallback is no-cache"

# 3. ngsw.json, manifest and ngsw-worker.js are 200 and no-cache.
for path in /ngsw.json /manifest.webmanifest /ngsw-worker.js; do
  [[ "$(status_of "$path")" == 200 ]] || fail "3: GET $path is not 200"
  [[ "$(header_of "$path" cache-control)" == "no-cache" ]] || fail "3: $path is not no-cache"
done
pass "3 worker, manifest and ngsw.json are no-cache"

# 4. An existing hashed file is immutable; hashed-looking absent names and absent icons are 404.
MAIN="$(curl -s "$BASE/" | grep -Eo 'main-[A-Z0-9]{8}\.js' | head -n1)"
[[ -n "$MAIN" ]] || fail "4: no main-*.js referenced by index.html"
header_of "/$MAIN" cache-control | grep -q 'immutable' || fail "4: /$MAIN is not immutable"
[[ "$(status_of /main-ZZZZZZZZ.js)" == 404 ]] || fail "4: absent hashed name is not 404"
header_of /main-ZZZZZZZZ.js cache-control | grep -q 'immutable' && fail "4: absent hashed name is immutable"
[[ "$(status_of /icons/absent.png)" == 404 ]] || fail "4: /icons/absent.png is not 404"
curl -s "$BASE/icons/absent.png" | grep -q '<sspc-root' && fail "4: /icons/absent.png answered the fallback page"
pass "4 hashed files immutable, absent names 404"

# 5. The CSP equals the contract, and the other three headers are present.
[[ "$(header_of / content-security-policy)" == "$CSP" ]] || fail "5: CSP differs from the contract"
[[ "$(header_of / x-content-type-options)" == "nosniff" ]] || fail "5: X-Content-Type-Options"
[[ "$(header_of / referrer-policy)" == "no-referrer" ]] || fail "5: Referrer-Policy"
[[ -n "$(header_of / permissions-policy)" ]] || fail "5: Permissions-Policy missing"
pass "5 security headers"

# 6. /_ds falls back to the shell, and the served tree holds no catalogue marker (checked in 9).
[[ "$(status_of /_ds)" == 200 ]] || fail "6: GET /_ds is not 200"
curl -s "$BASE/_ds" | grep -q '<sspc-root' || fail "6: /_ds is not the fallback shell"
pass "6 /_ds falls back to the shell"

# 7. Logs: no error level and no line that mentions a request.
LOGS="$(docker logs "$NAME" 2>&1 || true)"
if grep -q '"level":"error"' <<<"$LOGS"; then fail "7: error lines in the container log"; fi
if grep -Eq '"request"|"uri"|access' <<<"$LOGS"; then fail "7: a log line mentions a request"; fi
pass "7 logs have no errors and no request lines"

# 8. The served JavaScript carries the version passed at build time. About is a lazy route, so the
# string sits in a lazy chunk, not in main-*.js; the check reads every served .js file (the
# contract's main-*.js wording is updated to match). Enable with SMOKE_CHECK_VERSION=1 (T089).
if [[ "${SMOKE_CHECK_VERSION:-0}" == 1 ]]; then
  CID8="$(docker create "$IMAGE")"
  mkdir -p "$WORK/tree8"
  docker cp "$CID8:/srv/." "$WORK/tree8/" >/dev/null
  docker rm "$CID8" >/dev/null
  grep -rqF --include='*.js' "$APP_VERSION" "$WORK/tree8" || fail "8: $APP_VERSION not in any served .js file"
  pass "8 version in the served bundle"
else
  echo "skip: 8 version in the bundle (set SMOKE_CHECK_VERSION=1 to run it)"
fi

# 9. The served tree holds only allowlisted files (listed with docker create and docker cp).
CID="$(docker create "$IMAGE")"
docker cp "$CID:/srv" "$WORK/srv" >/dev/null
docker rm -f "$CID" >/dev/null
SRV="$WORK/srv"
FILES="$(cd "$SRV" && find . -type f | sed 's#^\./##')"
while IFS= read -r file; do
  case "$file" in
    index.html|favicon.ico|manifest.webmanifest|ngsw.json|ngsw-worker.js|safety-worker.js|worker-basic.min.js) ;;
    media/*|icons/*|images/*) ;;
    *.js|*.css) ;;
    *) fail "9: unexpected file in /srv: $file" ;;
  esac
  case "$file" in
    *.map|*.ts|*.md|Dockerfile*|Caddyfile*|DESIGN*) fail "9: forbidden file in /srv: $file" ;;
  esac
done <<<"$FILES"
if grep -l 'sourceMappingURL' "$SRV"/*.js >/dev/null 2>&1; then fail "9: sourceMappingURL in a bundle"; fi
if grep -rl 'sspc-catalog' "$SRV" >/dev/null 2>&1; then fail "9: catalogue marker in the default image (FR-024)"; fi
pass "9 served tree is allowlisted"

# 10. No absolute http(s) URL in index.html, styles, manifest or ngsw.json; no data groups.
for file in "$SRV/index.html" "$SRV"/*.css "$SRV/manifest.webmanifest" "$SRV/ngsw.json"; do
  if grep -Eq 'https?://' "$file"; then fail "10: absolute URL in ${file#"$SRV"/}"; fi
done
grep -Eq '"dataGroups": *\[\]' "$SRV/ngsw.json" || fail "10: ngsw.json has data groups"
pass "10 no remote URLs, no data groups"

echo "App image assertions passed for $IMAGE (assertion 8 runs only with SMOKE_CHECK_VERSION=1)."
