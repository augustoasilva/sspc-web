# Test-only counter proxy image (contracts/http-serving.md §Files). Never served to users and
# never part of a production image. Node only: npm and npx are removed.
FROM node:26.13.1-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
 && rm -rf /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/corepack
WORKDIR /app
COPY tools/offline-proof/counter-proxy.mjs tools/offline-proof/count.mjs ./
USER 65532:65532
ENTRYPOINT ["node", "/app/counter-proxy.mjs"]
