import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/pengujian/**/*.test.ts'],
    testTimeout: 60000,
    hookTimeout: 60000,
    environment: 'node',
    passWithNoTests: false,
    // Pengujian memakai database yang sama, jadi harus berurutan
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
  },
});
