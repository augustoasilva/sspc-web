# Test-only counter proxy image (contracts/http-serving.md §Files). Never served to users and
# never part of a production image. Node only: npm and npx are removed.
FROM node:24.22.2-alpine@sha256:8a32c8cf649a49915a66e81e7a609223c708d0adabf288ee3f4077d765542f85
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
 && rm -rf /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/corepack
WORKDIR /app
COPY tools/offline-proof/counter-proxy.mjs tools/offline-proof/count.mjs ./
USER 65532:65532
ENTRYPOINT ["node", "/app/counter-proxy.mjs"]
