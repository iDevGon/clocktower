import { defineConfig } from 'vitest/config';

// biome-ignore lint/style/noDefaultExport: required by vitest
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    reporters: ['verbose'],
  },
});
