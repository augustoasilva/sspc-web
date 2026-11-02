# Contract: HTTP serving and image runtime

**Feature**: [spec.md](../spec.md) | **Research**: R-08, R-16, R-17, R-23 | **Consumer**: `sspc-api/deploy/compose.local.yaml` (service `web`) and, later, the cluster

## Image runtime contract (both images)

| Property | Value | Why |
|----------|-------|-----|
| Listens on | `0.0.0.0:8080`, HTTP/1.1 | the stack's edge proxies to `web:8080`; TLS ends at the edge |
| User | `65532:65532` | the stack sets the same user |
| Root filesystem | read-only compatible | the stack and the cluster mount it read-only |
| Writable paths | `/tmp` (tmpfs in the stack), `/data`, `/config` (declared `VOLUME`, owned by 65532; `emptyDir` in the cluster) | Caddy state and autosave; verified: zero error lines in the stack's mode |
| Capabilities | none needed: `setcap -r /usr/bin/caddy` in the final stage | stock Caddy fails under `cap_drop ALL` with `operation not permitted` (verified) |
| Privilege escalation | none (`no-new-privileges` compatible) | stack and cluster setting |
| Entrypoint | `caddy run --config /etc/caddy/Caddyfile --adapter caddyfile` | |
| Build args (app) | `APP_VERSION` default `0.0.0+dev`, `APP_BUILD` default `local`, `SSPC_CATALOG` default `false` | the stack builds with the context only, so defaults must work. `SSPC_CATALOG=true` makes a **test build** that keeps the development catalogue (iPhone update test, quickstart D4); release builds never pass it, and the smoke test asserts the default image has no catalogue |
| Healthy when | `GET /` returns `200` | no health endpoint is added |
| Base images | pinned by digest: `FROM node:24.22.2@sha256:…` (builder) and `FROM caddy:2.11.7@sha256:…` (both runtime stages); values in research R-29 | SEC-005; a policy check fails any `FROM` without a digest; Dependabot proposes updates |
| Build arguments | only `APP_VERSION`, `APP_BUILD`, `SSPC_CATALOG`; never a secret (arguments stay visible in image metadata) | SEC-004; the same policy check rejects any other `ARG` |
| Contents of `/srv` | an explicit allowlist, below | SEC-005 |

Build stage (app): `node:24.22.2@sha256:…`, `npm ci`, `npm run build -- --define "APP_VERSION='${APP_VERSION}'" --define "APP_BUILD='${APP_BUILD}'" --define "SSPC_CATALOG=${SSPC_CATALOG}"`; copies `dist/sspc-web/browser` to `/srv`. Production builds set `sourceMap: false`. Site: the Dockerfile copies named paths only (`index.html`, `links/`, `assets/`; never `COPY . .`) and `site/.dockerignore` excludes everything else; no build step.

**What each image may contain** (SEC-005): the runtime server (`caddy`), `/etc/caddy/Caddyfile`, and under `/srv` only the allowlisted public files. App: `index.html`, hashed `*.js` and `*.css`, `media/` fonts, `icons/`, `images/` (the About photo), `favicon.ico`, `manifest.webmanifest`, `ngsw.json`, `ngsw-worker.js`, `safety-worker.js`. Site: `index.html`, `links/index.html`, `assets/{css,fonts,img}/`. Neither contains source maps, TypeScript, tests, specifications, build files, `DESIGN.md`, `Dockerfile`, `Caddyfile` copies under `/srv`, or the other image's files. Everything in `public/` reaches `/srv` unchanged (`angular.json` copies it as is), so only files meant to be served live there: no README or notes (assertion 9 below fails on a `.md`).

## App routes and behaviour (`Caddyfile`)

| Request | Response |
|---------|----------|
| an existing file with a hashed name `*-XXXXXXXX.js\|css\|woff2` (regex `-[A-Z0-9]{8}\.(js\|css\|woff2)$`) | the file, `Cache-Control: public, max-age=31536000, immutable` (only when the file exists) |
| any other existing file under `/srv`, and `/` (`/index.html`, `/ngsw.json`, `/ngsw-worker.js`, `/safety-worker.js`, `/manifest.webmanifest`, icons, images) | the file, `Cache-Control: no-cache` |
| a path with no extension and no file (`/sobre`, `/_ds`) | `/index.html` with `200` and `Cache-Control: no-cache` (SPA fallback) |
| a path with an extension and no file, a hashed-looking name included (`/main-ZZZZZZZZ.js`, `/icons/absent.png`) | `404` with `Cache-Control: no-cache`; never the fallback page and never `immutable` |

Structure (prototyped and run on the pinned image under the stack's restrictions, research R-17): after `root * /srv` and the `header` block of the four security headers, `@hashed { path_regexp hashed -[A-Z0-9]{8}\.(js|css|woff2)$ ; file {path} }` handled by `handle @hashed { header Cache-Control "public, max-age=31536000, immutable" ; file_server }`, then a default `handle { header Cache-Control no-cache ; @spa { not path_regexp \.[A-Za-z0-9]+$ ; not file {path} } ; rewrite @spa /index.html ; file_server }`. Plain `header` directives with path matchers are not enough: they run before the fallback and see the original path (so `/` and `/sobre` got no `Cache-Control`), a missing hashed-looking name was answered as `200 text/html` with `immutable`, and a later catch-all `header` overrides an earlier specific one.

## Headers on every response

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | `default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

No `Strict-Transport-Security` (TLS ends at the edge, which owns it). No `Server` disclosure beyond Caddy's default is added or removed.

## Global options and logging

`admin off`, `auto_https off`, `servers { protocols h1 }`, and a global default log whose encoder deletes the whole `request` object:

```caddyfile
log {
	output stderr
	format filter {
		wrap json
		fields {
			request delete
		}
	}
}
```

There is **no `log` directive in any site block**, so there is no access log (SEC-008; measured in research R-27: Caddy writes none by default). The filter exists because Caddy's error log for a 5xx otherwise carries the client address, the full URI with query string and request headers; with the filter such a line keeps only `status`, `duration` and `err_id`. Operational lines (startup, storage) stay. The same block is in `site/Caddyfile`. Local tests may opt into the request counter below, which records only a count.

## Site (`site/Caddyfile`)

Same global options and runtime contract; no access log. The site uses the headers above except its CSP is `default-src 'self'; script-src 'none'; object-src 'none'; img-src 'self'; style-src 'self'; connect-src 'none'; worker-src 'none'; manifest-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. It has no scripts or injected styles, so it needs no inline or remote allowances. Routes: `/` → `index.html`; `/links` and `/links/` → `links/index.html` (`try_files {path} {path}/index.html`; `redir /links /links/` when the path has no slash); unknown paths → `404` with a plain page; `Cache-Control: no-cache` on every response, the 404 page included (the site has no build step and no hashed assets, so nothing is immutable; a matcher on `*.html` would miss `/links/`). No SPA fallback, no service worker, no cookies.

## Smoke assertions (run by the `image` job and by the quickstart)

App image, started with `--user 65532:65532 --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges:true`:

1. `GET /` → `200`, `text/html`, contains `<sspc-root>` (the root selector follows the `sspc` prefix of Principle III; the scaffold's `app-root` is renamed), contains no `onload=` and no inline `<script>`.
2. `GET /sobre` → `200` with the same body as `/` (fallback); both carry `Cache-Control: no-cache`.
3. `GET /ngsw.json`, `/manifest.webmanifest` → `200` with `Cache-Control: no-cache`; `GET /ngsw-worker.js` → `200`, no-cache.
4. A hashed `main-*.js` → `Cache-Control` contains `immutable`; `GET /main-ZZZZZZZZ.js` (hashed-looking, absent) → `404` without `immutable`; `GET /icons/absent.png` → `404`, not the fallback page.
5. The CSP header equals the table above exactly; the other three headers are present.
6. `GET /_ds` returns the fallback page and `grep -r "sspc-catalog"` over the served tree finds nothing, that selector of the catalogue page being the marker of its chunk (FR-024).
7. Container logs contain zero lines with `"level":"error"` and **no line that mentions a request** (no `"request"`, no `"uri"`, no access-log logger); `caddy adapt` of the image's Caddyfile shows no access log and the `request delete` filter on the default log.
8. The reported version: `main-*.js` contains the `APP_VERSION` passed to the build.
9. The served tree (listed with `docker create` and `docker cp`, never by running a shell in the image) contains only allowlisted paths: no `*.map`, no `sourceMappingURL` in any `*.js`, no `.ts`, `.md`, `Dockerfile`, `Caddyfile` or `DESIGN*` file (SEC-004, SEC-005).
10. `index.html`, every `*.css`, `manifest.webmanifest` and `ngsw.json` contain no absolute `http(s)://` URL; `ngsw.json` lists only files under `/srv` and has no `dataGroups` (SEC-002).

Site image, same restrictions: `GET /` and `/links/` return `200`; the content check of Story 8 passes (the Vitest file `site/tests/content.test.mjs` run with `SITE_URL`, also asserting `target="_blank"` and `rel="noopener noreferrer"` on the two web links, a `mailto:` third link and no absolute URL in loaded resources other than the three link destinations); `GET /nope`, `/Dockerfile`, `/Caddyfile` and `/tests/content.test.mjs` return `404`; site-specific headers as specified above, and `Cache-Control: no-cache` on `/`, `/links/`, the stylesheet and `/nope`; zero error lines and no line that mentions a request; served tree listing as in assertion 9 with only the site allowlist; no response of either page carries a `Set-Cookie` header (FR-035).

Counter image (test-only, built by the `image` job but never served to users): starts under the same restrictions with `UPSTREAM` pointing at a stub; after N requests `count.mjs` prints N; the container produced no output at all; the app images contain no `tools/` content.

## Header rationale

The app intentionally uses `default-src 'self'` as fallback for scripts, fonts and objects; `worker-src 'self'` is explicit. Inline styles are retained for Angular-injected component styles, accepting that injected CSS can be applied if markup injection occurs; remove the allowance when a verified nonce-based or external-style build supports all components. No `data:` or `blob:` image allowance is needed. `frame-ancestors 'none'` blocks framing in supported browsers; no legacy X-Frame-Options fallback is required for the supported iOS Safari target. `nosniff` prevents MIME sniffing, `no-referrer` avoids leaking addresses, and Permissions-Policy disables camera, microphone and geolocation, not every browser feature. The local edge provides HTTPS but currently disables automatic redirects; HSTS and HTTP-to-HTTPS redirects are future hosting responsibilities (SEC-001).

## Local-only request counter

Provide a test-only Compose override and proxy in this repository. The override routes the existing edge's `web:8080` upstream to the proxy under the `web` service name and runs the actual catalogue-enabled app as a separate internal service. The proxy forwards every request to that app and increments one process-local integer for each incoming request, before forwarding. It records no request fields and emits no access logs. Its count is readable only by a command executed inside the proxy container, never through an HTTP endpoint; the counter is reset on proxy stop. Do not publish a proxy port or include this proxy in either production image. The override is explicitly enabled for the iPhone test and removed afterwards. Test the counter by observing a one-count increase for a known online request, then compare counts across each airplane-mode launch; a counter restart invalidates the trial. For the stack-stopped condition, the stopped stack itself establishes that it cannot receive requests. Implementation must supply the Compose override, counter read command and automated checks that normal builds omit this proxy and that no request details are recorded.

### Files (`tools/offline-proof/`)

| File | Contract |
|------|----------|
| `counter-proxy.mjs` | Node standard library only. Environment: `UPSTREAM` (default `http://web-app:8080`), `LISTEN_PORT` (default `8080`), `COUNT_SOCKET` (default `/tmp/counter.sock`). Increments the integer for every incoming request **before** forwarding method, URL, headers and body unchanged and streaming the answer back (a `304` or a `HEAD` passes through untouched); an upstream failure answers `502` with an empty body. Opens the control socket with mode `0600`; removes it on `SIGTERM` or `SIGINT`. Writes nothing to stdout, stderr or disk |
| `count.mjs` | Connects to `COUNT_SOCKET`, prints the integer and a newline, exits `0`; exits `1` with no output if the socket is missing (proxy not running) |
| `Dockerfile` | `FROM node:24.22.2-alpine@sha256:…`; removes npm and npx; copies only the two scripts to `/app`; `USER 65532:65532`; entrypoint `node /app/counter-proxy.mjs`; no `EXPOSE` of any control port |
| `Dockerfile.dockerignore` | BuildKit per-Dockerfile ignore file: `*`, then `!tools/offline-proof/counter-proxy.mjs` and `!tools/offline-proof/count.mjs`, so the proxy image sees nothing else of the repository. The repository `.dockerignore` excludes `tools/offline-proof`, so the app image never receives it |
| `compose.override.yaml` | Used with the sibling's `compose.local.yaml`. Service `web`: `image: sspc-offline-proof:local` (explicit, because the default name `<project>-web` is the one the sibling's `make stack` gives the base `web` it rebuilds), `build` of this directory's Dockerfile (same context `../../sspc-web`), `depends_on: [web-app]`, `environment: UPSTREAM`, no published ports, and the base file's `user`, `read_only`, `tmpfs /tmp`, `cap_drop`, `no-new-privileges` kept. New service `web-app`: `profiles: [web]`, `image: sspc-web-app:${APP_TAG:-first}`, `build` of the repository `Dockerfile` with arguments `SSPC_CATALOG=true`, `APP_VERSION=${APP_VERSION:-0.0.0+dev}`, `APP_BUILD=${APP_BUILD:-local}`, the same five restrictions, no published ports |
| `counter-proxy.test.mjs` | Vitest, node environment, table-driven: N forwarded requests (several methods, query strings, cookies) read back as N; a conditional request answered `304` is counted; the process produced no output; the socket mode is `0600`; the socket is gone after `SIGTERM`; an unreachable upstream answers `502` and still counts |

Commands (the sibling is checked out beside this repository; verified at revision `f7ee750` on 2026-11-01; re-check if it moved). With `COMPOSE="docker compose --project-directory ../sspc-api/deploy -f ../sspc-api/deploy/compose.local.yaml -f tools/offline-proof/compose.override.yaml --env-file ../sspc-api/deploy/.env.local --profile web"`:

| Purpose | Command |
|---------|---------|
| Enable the proxy and the catalogue-enabled app (first build) | `APP_VERSION=0.0.0+dev APP_BUILD=first APP_TAG=first $COMPOSE up -d --build --no-deps web web-app` |
| Read the count | `$COMPOSE exec -T web node /app/count.mjs` |
| Pre-build another tagged test build, once before the update test | `APP_VERSION=0.0.1+dev APP_BUILD=second APP_TAG=second $COMPOSE build web-app` (the tag keeps each build: a rebuild without `APP_TAG` would overwrite `first`) |
| "Deploy" a pre-built build, leaving the proxy (and its count) running | `APP_TAG=second $COMPOSE up -d --no-build --no-deps web-app`, then wait until `curl http://localhost:8080/manifest.webmanifest` answers `200` |
| Stop the whole stack, override included (offline condition 2) | `$COMPOSE down` (the sibling's `make stack-down` is a plain `down` that leaves the profile-gated `web` and `web-app` running) |
| Re-apply after the stack was restarted with `make stack` | `APP_TAG=first $COMPOSE up -d --no-build --no-deps web web-app`, then take a fresh baseline count |
| Disable after the test | `$COMPOSE rm -sf web web-app`, then `$COMPOSE down` or a restart without the override (`LAN_ENABLE=1 make stack`) |

Validity rules for the trial: read the count before and after each launch and record the difference; a read that fails or a count that went down means the proxy restarted and the trial is void; the first reading is validated by one known request (`curl http://localhost:8080/manifest.webmanifest` through the loopback edge raises the count by exactly one).

## Published-image validation handoff

The later sibling release workflow builds and publishes a candidate to a local registry during the manual phase, captures its immutable digest and pulls that exact digest into the SSPC validation environment. Before promotion, inspect the image's served tree and JS bundles for the catalogue route and code, including lazy chunks; a catalogue-enabled candidate, missing evidence, or inspection failure blocks promotion. Start the pulled image against the local API stack, request `/`, `/sobre`, `/_ds` and all referenced static assets, and confirm `/_ds` does not load a catalogue (SPA fallback alone is not evidence). From the browser make an explicit same-origin API health request and confirm it reaches the expected local backend; this shell does not itself call the API. Review console errors and failed network responses. Record the image digest, source revision, environment, date and each result in phase validation notes; repeat inspection on the published digest before promotion and do not promote on failure. The present CI remains non-publishing.
