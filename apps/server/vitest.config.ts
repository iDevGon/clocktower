import { defineConfig } from 'vitest/config';

// biome-ignore lint/style/noDefaultExport: required by vitest
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    exclude: ['src/__tests__/e2e/**'],
    reporters: ['verbose'],
  },
});
