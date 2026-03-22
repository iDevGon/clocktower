import { defineConfig } from 'vitest/config';

// biome-ignore lint/style/noDefaultExport: required by vitest
export default defineConfig({
  test: {
    include: ['src/__tests__/e2e/**/*.test.ts'],
    testTimeout: 15000,
    hookTimeout: 10000,
    reporters: ['verbose'],
  },
});
