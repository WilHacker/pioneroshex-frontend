import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    // Valor fijo para los tests: no dependen del .env.local de cada máquina.
    env: { NEXT_PUBLIC_API_URL: 'http://localhost:3001' },
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      // El umbral aplica solo a la lógica pura (config y lib), no a los componentes de UI.
      include: ['src/config/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['**/*.test.{ts,tsx}'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
