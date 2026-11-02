# SSPC Studio (sspc-web)

The installable PWA of **Só Saio Pra Comer**: the app shell (home, About, connection status, update notice) that a phone installs and opens offline, plus the static profile site that the same repository builds as its own image.

The feature is specified in [specs/001-installable-pwa-shell](specs/001-installable-pwa-shell/). Start with [quickstart.md](specs/001-installable-pwa-shell/quickstart.md) for how to validate it and [plan.md](specs/001-installable-pwa-shell/plan.md) for the architecture.

## Two images

| Image | Built from | What it serves | Port in the container |
|-------|-----------|----------------|-----------------------|
| App (`sspc-web`) | `Dockerfile` at the repository root | The Angular app, with its service worker and manifest | 8080 |
| Site (`sspc-site`) | `site/Dockerfile` | The static profile site (`/`, `/links/`) | 8080 |

The two images are independent artefacts: changing a file in `site/` does not change the app image, and the reverse holds too (quickstart section C checks this). Both run as a non-root user with a read-only root filesystem and no capabilities.

## Requirements

- Node 24 and npm 11 (the builder image uses `node:24.22.2`).
- Docker, for the container checks.
- The sibling repository `sspc-api` checked out next to this one (`../sspc-api`), only for the iPhone stack in quickstart section D.

## Install

```sh
npm ci
```

## Scripts

| Script | What it does |
|--------|--------------|
| `npm start` | Development server at `http://localhost:4200/`. The service worker is off in development. |
| `npm run build` | Production build into `dist/sspc-web` (budget: 400 kB warning, 600 kB error on the initial JS). Runs `design:lint` and `tokens:build` first. |
| `npm test` | Unit tests of the app with Vitest (`ng test`). Runs `design:lint` and `tokens:build` first. |
| `npm run test:tools` | Tests of the policy scripts, the token build, the lint rules and the site content check (the site check runs only when `SITE_URL` is set). |
| `npm run lint` | ESLint over the repository and stylelint over `src/app/ui`. |
| `npm run design:lint` | Checks [DESIGN.md](DESIGN.md) with `design.md lint`. |
| `npm run tokens:build` | Regenerates the design tokens from `DESIGN.md`: `src/app/ui/tokens/` and `site/assets/css/tokens.css`. Never edit those files by hand. |
| `npm run tokens:check` | Regenerates the tokens and fails if the committed files differ. |
| `npm run policy` | The repository policy checks: workflow, Dockerfiles, agent settings, Caddyfiles, image metadata, validation record and security exceptions. |
| `npm run audit` | `npm audit` for high and critical advisories, development dependencies included, minus unexpired exceptions. Needs the registry. |

## Run the local gates

```sh
npm run design:lint
npm run tokens:check
npm run lint
npm test
npm run build
npm run test:tools
npm run policy
npm run audit
```

## Run the app image

```sh
docker build -t sspc-web:local --build-arg APP_VERSION=0.0.0+dev --build-arg APP_BUILD=local .
docker run -d --name sspc-web-smoke --user 65532:65532 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges:true -p 18080:8080 sspc-web:local
scripts/smoke-app.sh sspc-web:local
docker rm -f sspc-web-smoke
```

The smoke script checks the serving rules of [contracts/http-serving.md](specs/001-installable-pwa-shell/contracts/http-serving.md): the cache headers, the Content Security Policy, the 404 responses and the clean logs.

## Run the site image

```sh
docker build -t sspc-site:local site
docker run -d --name sspc-site-smoke --user 65532:65532 --read-only --tmpfs /tmp \
  --cap-drop ALL --security-opt no-new-privileges:true -p 18081:8080 sspc-site:local
SITE_URL=http://localhost:18081 npx vitest run --config vitest.tools.config.ts site/tests
scripts/smoke-site.sh sspc-site:local
docker rm -f sspc-site-smoke
```

Open `http://localhost:18081` to see the site. The app image must be served over HTTPS to install (a secure context); `localhost` counts as secure, other addresses do not.

## Repository layout

- `src/app/ui/`: shared components, their tokens and their specifications (each has a README, a harness and tests).
- `src/app/features/`: the pages of the app; `catalog` is the development catalogue at `/_ds`, not shipped to production.
- `src/app/core/`: services (app version, storage persistence, unsaved work, update checks).
- `site/`: the static profile site, its Caddyfile and its Dockerfile.
- `scripts/`: smoke tests, branch and secret checks, and the policy checks under `scripts/policy/`.
- `tools/`: the token build and the offline proof counter used by the test environment.
- `specs/`: the specification, plan, tasks, research and validation record of this feature.
- `.github/workflows/ci.yml`: the pull request workflow (lint, test, build, security, image and branch guard jobs).

## Design and constitution

[DESIGN.md](DESIGN.md) is the design source; it wins over the Stitch screens. The project rules are in `.specify/memory/constitution.md`.
