# Site image (contracts/http-serving.md §Site). Static files only: there is no build stage, and the
# named COPY lines below are the whole of /srv (SEC-005). Never COPY . . here.
FROM caddy:2.11.7@sha256:36c24ad91a7ff7bc4c87fe22bfa8df3c4b18da0773d73fc12ee2c52b98c0bb7e
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
