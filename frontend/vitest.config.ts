import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'src/tests/',
                '**/*.test.ts',
                '**/*.test.tsx',
                'src/vite-env.d.ts',
                'src/main.tsx',
                'vite.config.ts',
                'vitest.config.ts',
                'vitest.setup.ts',
                '**/*.d.ts',
                'src/assets/',
                'src/constants/',
            ],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
        include: ['src/tests/**/*.test.{ts,tsx}'],
        css: {
            modules: {
                classNameStrategy: 'non-scoped',
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
