/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        host: '0.0.0.0',
        allowedHosts: true,
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        include: ['src/tests/**/*.test.{ts,tsx}'],
        css: {
            modules: {
                classNameStrategy: 'non-scoped',
            },
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
            // Count every source file, not just the ones a test happens to
            // import, so the reported numbers are honest.
            include: ['src/**/*.{ts,tsx}'],
            exclude: [
                'node_modules/',
                'src/tests/',
                'src/**/*.d.ts',
                'src/main.tsx',
                'src/assets/',
            ],
            // Ratchet: these are the measured baseline (lines 45.1, functions
            // 41.6, branches 32.8, statements 45.2) minus 2 points. The earlier
            // 80% gate only measured files that tests happened to import, so it
            // never saw the untested components. Raise these as legacy code is
            // replaced by tested layers; never lower them.
            thresholds: {
                lines: 43,
                functions: 39,
                branches: 30,
                statements: 43,
            },
        },
    },
})
