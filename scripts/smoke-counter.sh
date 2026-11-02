#!/usr/bin/env bash
# Smoke test of the test-only counter image (contracts/http-serving.md §Smoke assertions).
# A stub upstream and the counter run on a private network under the stack's restrictions.
# N requests through the counter must read back as N, and the counter must print nothing.
# Then the production images must hold no tools/ content.
# Usage: scripts/smoke-counter.sh COUNTER_IMAGE [PRODUCTION_IMAGE...]
set -euo pipefail

COUNTER_IMAGE="${1:?usage: scripts/smoke-counter.sh COUNTER_IMAGE [PRODUCTION_IMAGE...]}"
shift
REQUESTS="${SMOKE_REQUESTS:-5}"
ID="$$"
NET="sspc-counter-smoke-${ID}"
STUB="sspc-counter-stub-${ID}"
COUNTER="sspc-counter-smoke-${ID}-proxy"

cleanup() {
  docker rm -f "$COUNTER" "$STUB" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

docker network create "$NET" >/dev/null

# Stub upstream: any busybox httpd, serving an empty directory. Only the count matters here.
docker run -d --name "$STUB" --network "$NET" busybox:stable httpd -f -p 8080 -h /tmp >/dev/null

docker run -d --name "$COUNTER" --network "$NET" --user 65532:65532 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges:true \
  -e UPSTREAM="http://${STUB}:8080" "$COUNTER_IMAGE" >/dev/null

# Waits until the proxy has its control socket.
for _ in $(seq 1 40); do
  if docker exec "$COUNTER" node /app/count.mjs >/dev/null 2>&1; then break; fi
  sleep 0.25
done

# N requests from a client on the same network, through the proxy.
for _ in $(seq 1 "$REQUESTS"); do
  docker run --rm --network "$NET" busybox:stable wget -q -O /dev/null "http://${COUNTER}:8080/" || true
done

COUNT="$(docker exec "$COUNTER" node /app/count.mjs)" || fail "count.mjs did not answer"
[[ "$COUNT" == "$REQUESTS" ]] || fail "count reads $COUNT, expected $REQUESTS"
echo "ok: $REQUESTS requests read back as $COUNT"

# The counter produced no output of any kind.
LOGS="$(docker logs "$COUNTER" 2>&1 || true)"
[[ -z "$LOGS" ]] || fail "the counter produced output"
echo "ok: the counter produced no output"

# The production images contain no tools/ content (the counter is never shipped).
for IMAGE in "$@"; do
  CID="$(docker create "$IMAGE")"
  if docker export "$CID" | tar -t | grep -Eq 'counter-proxy|offline-proof|count\.mjs'; then
    docker rm "$CID" >/dev/null
    fail "$IMAGE contains counter files"
  fi
  docker rm "$CID" >/dev/null
  echo "ok: $IMAGE contains no counter files"
done

echo "All counter image assertions passed for $COUNTER_IMAGE."
