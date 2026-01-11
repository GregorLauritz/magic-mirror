import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'src/tests/json_schemas/**', // These are schema definitions, not test files
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'coverage/**',
        '**/*.test.ts',
        '**/*.config.ts',
        'src/index.ts',
        'src/tests/**',
      ],
    },
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      config: path.resolve(__dirname, './src/config'),
      models: path.resolve(__dirname, './src/models'),
      routes: path.resolve(__dirname, './src/routes'),
      services: path.resolve(__dirname, './src/services'),
    },
  },
});
