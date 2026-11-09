# Test-only counter proxy image (contracts/http-serving.md §Files). Never served to users and
# never part of a production image. Node only: npm and npx are removed.
FROM node:26.13.0-alpine@sha256:8996bb5821d62a8fd9bb27c1cb07462f3fdce6e47d640c6a881ead0b064ce216
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
 && rm -rf /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/corepack
WORKDIR /app
COPY tools/offline-proof/counter-proxy.mjs tools/offline-proof/count.mjs ./
USER 65532:65532
ENTRYPOINT ["node", "/app/counter-proxy.mjs"]
