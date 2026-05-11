import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    env: {
      VITE_AUTH_EMAIL: 'test@example.com',
      VITE_AUTH_PASSWORD: 'testpass123',
      VITE_TARGET: 'enterprise',
    },
    include: ['src/**/*.enterprise.test.{ts,tsx}', 'src/shared/services/httpClient.test.ts'],
    exclude: ['node_modules', 'dist', 'e2e/**', 'playwright-report/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/services/**',
        'src/hooks/**',
        'src/shared/components/**',
      ],
      exclude: ['src/test/**', '**/*.test.*', '**/*.d.ts'],
    },
  },
});
