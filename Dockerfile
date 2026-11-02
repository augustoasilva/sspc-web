# App image (contracts/http-serving.md §Image runtime contract). Build arguments are the only
# ones allowed (SEC-004): APP_VERSION, APP_BUILD and SSPC_CATALOG.
FROM node:24.22.2@sha256:e7add2a490bb17d97b485b8641bd88455fff7839ade0f5eba493c3508124d413 AS build
ARG APP_VERSION=0.0.0+dev
ARG APP_BUILD=local
ARG SSPC_CATALOG=false
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build -- --define "APP_VERSION='${APP_VERSION}'" --define "APP_BUILD='${APP_BUILD}'" --define "SSPC_CATALOG=${SSPC_CATALOG}"

FROM caddy:2.11.7@sha256:36c24ad91a7ff7bc4c87fe22bfa8df3c4b18da0773d73fc12ee2c52b98c0bb7e
# The pinned Caddy binary carries a file capability that fails under cap_drop ALL; drop it.
RUN setcap -r /usr/bin/caddy \
 && mkdir -p /data /config \
 && chown 65532:65532 /data /config
COPY --from=build /src/dist/sspc-web/browser /srv
COPY Caddyfile /etc/caddy/Caddyfile
VOLUME ["/data", "/config"]
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
