# Site image (contracts/http-serving.md §Site). Static files only: there is no build stage, and the
# named COPY lines below are the whole of /srv (SEC-005). Never COPY . . here.
FROM caddy:2.11.8@sha256:4fcafa98afd1c2e642e353e3c5cf9ddbe892fcee14bc990e7ba2c5b78e51f9cf
# Patched Alpine packages with the fixed versions of the CI scan (brotli, curl): the base image is pinned,
# so these two are upgraded explicitly. Remove this line when the pinned Caddy image carries them.
RUN apk upgrade --no-cache brotli-libs curl libcurl
# The pinned Caddy binary carries a file capability that fails under cap_drop ALL; drop it.
RUN setcap -r /usr/bin/caddy \
 && mkdir -p /data /config \
 && chown 65532:65532 /data /config
COPY index.html /srv/index.html
COPY links/ /srv/links/
COPY assets/ /srv/assets/
COPY Caddyfile /etc/caddy/Caddyfile
VOLUME ["/data", "/config"]
USER 65532:65532
EXPOSE 8080
ENTRYPOINT ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
