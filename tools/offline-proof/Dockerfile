# Test-only counter proxy image (contracts/http-serving.md §Files). Never served to users and
# never part of a production image. Node only: npm and npx are removed.
FROM node:26.13.0-alpine@sha256:c6ad9e9c1d80f6eb607c26b4b0a132ff7a2344fad1c78ea3baa2a7d4c8de6d94
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
 && rm -rf /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/corepack
WORKDIR /app
COPY tools/offline-proof/counter-proxy.mjs tools/offline-proof/count.mjs ./
USER 65532:65532
ENTRYPOINT ["node", "/app/counter-proxy.mjs"]
