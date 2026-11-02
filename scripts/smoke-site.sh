#!/usr/bin/env bash
# Smoke test of the site image (contracts/http-serving.md §Smoke assertions, site). Runs the image
# under the restrictions, checks each assertion and stops at the first failure, naming it, then
# runs the content check (site/tests/content.test.mjs) against the running container.
# Usage: scripts/smoke-site.sh IMAGE
set -euo pipefail

IMAGE="${1:?usage: scripts/smoke-site.sh IMAGE}"
NAME="sspc-smoke-site-$$"
WORK="$(mktemp -d)"
CSP="default-src 'self'; script-src 'none'; object-src 'none'; img-src 'self'; style-src 'self'; connect-src 'none'; worker-src 'none'; manifest-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"

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

# Waits until the site answers, so the first request is not a start-up race.
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null "$BASE/" 2>/dev/null; then break; fi
  sleep 0.5
done

# status_of PATH: prints the HTTP status. headers_of PATH: prints the response headers.
status_of() { curl -s -o /dev/null -w '%{http_code}' "$BASE$1"; }
headers_of() { curl -s -D - -o /dev/null "$BASE$1" | tr -d '\r'; }
header_of() { headers_of "$1" | grep -i "^$2:" | head -n1 | sed -E "s/^[^:]*:[[:space:]]*//"; }

# 1. GET / and GET /links/ are 200 text/html.
[[ "$(status_of /)" == 200 ]] || fail "1: GET / is not 200"
[[ "$(status_of /links/)" == 200 ]] || fail "1: GET /links/ is not 200"
header_of / content-type | grep -q 'text/html' || fail "1: GET / is not text/html"
pass "1 home and links pages answer 200"

# 2. The unknown paths and the files that must not be served answer 404.
for path in /nope /Dockerfile /Caddyfile /tests/content.test.mjs; do
  [[ "$(status_of "$path")" == 404 ]] || fail "2: GET $path is not 404"
done
pass "2 unknown paths and build files are 404"

# 3. The site CSP and the other three headers, on the pages and on the 404 page.
for path in / /links/ /nope; do
  [[ "$(header_of "$path" content-security-policy)" == "$CSP" ]] || fail "3: CSP differs from the contract on $path"
  [[ "$(header_of "$path" x-content-type-options)" == "nosniff" ]] || fail "3: X-Content-Type-Options missing on $path"
  [[ "$(header_of "$path" referrer-policy)" == "no-referrer" ]] || fail "3: Referrer-Policy missing on $path"
  [[ -n "$(header_of "$path" permissions-policy)" ]] || fail "3: Permissions-Policy missing on $path"
done
pass "3 security headers on pages and the 404 page"

# 4. Cache-Control is no-cache on the pages, the stylesheet and the 404 page.
for path in / /links/ /assets/css/site.css /nope; do
  [[ "$(header_of "$path" cache-control)" == "no-cache" ]] || fail "4: $path is not no-cache"
done
pass "4 every response is no-cache"

# 5. No cookie on either page (FR-035).
for path in / /links/; do
  if headers_of "$path" | grep -qi '^set-cookie:'; then fail "5: $path sets a cookie"; fi
done
pass "5 no Set-Cookie on the pages"

# 6. Logs: no error level and no line that mentions a request.
LOGS="$(docker logs "$NAME" 2>&1 || true)"
if grep -q '"level":"error"' <<<"$LOGS"; then fail "6: error lines in the container log"; fi
if grep -Eq '"request"|"uri"|access|GET |HTTP/' <<<"$LOGS"; then fail "6: a log line mentions a request"; fi
pass "6 logs have no errors and no request lines"

# 7. The served tree holds only the site allowlist (listed with docker create and docker cp).
CID="$(docker create "$IMAGE")"
docker cp "$CID:/srv" "$WORK/srv" >/dev/null
docker rm -f "$CID" >/dev/null
FILES="$(cd "$WORK/srv" && find . -type f | sed 's#^\./##')"
while IFS= read -r file; do
  case "$file" in
    index.html|links/index.html) ;;
    assets/css/*|assets/fonts/*|assets/img/*) ;;
    *) fail "7: unexpected file in /srv: $file" ;;
  esac
done <<<"$FILES"
pass "7 served tree is allowlisted"

# 8. The content check runs against the container (site/tests/content.test.mjs, FR-033 to FR-035).
SITE_URL="$BASE" npx vitest run --config vitest.tools.config.ts site/tests || fail "8: the content check failed"
pass "8 content check against the running site"

echo "Site image assertions passed for $IMAGE."
