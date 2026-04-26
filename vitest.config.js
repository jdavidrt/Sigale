import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    // Per-file environment override: pure util tests stay in node (fast),
    // context/component tests opt into jsdom via a `@vitest-environment`
    // comment at the top of the file.
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.{js,jsx}'],
    setupFiles: ['tests/setup.js'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/utils/**/*.js', 'src/context/**/*.jsx', 'src/hooks/**/*.js'],
    },
  },
});
