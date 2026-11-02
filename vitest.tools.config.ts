import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 30_000,
    include: ['scripts/**/*.test.mjs', 'tools/**/*.test.mjs', 'site/tests/**/*.test.mjs'],
  },
});
