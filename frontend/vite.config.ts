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
            // Ratchet: each threshold is the measured value minus a few points
            // (measured: domain 100/98, application 100/94, infrastructure
            // 99/95, features 99/97, shared 98/100 lines/branches). Raise them
            // when the tests get better; never lower them. A new layer or
            // feature that arrives untested fails the gate here.
            thresholds: {
                lines: 96,
                functions: 95,
                branches: 94,
                statements: 96,
                'src/domain/**': {
                    lines: 97,
                    functions: 97,
                    branches: 95,
                    statements: 97,
                },
                'src/application/**': {
                    lines: 97,
                    functions: 97,
                    branches: 90,
                    statements: 97,
                },
                'src/infrastructure/**': {
                    lines: 96,
                    functions: 96,
                    branches: 90,
                    statements: 96,
                },
                'src/features/**': {
                    lines: 95,
                    functions: 93,
                    branches: 94,
                    statements: 95,
                },
                'src/shared/**': {
                    lines: 94,
                    functions: 88,
                    branches: 95,
                    statements: 94,
                },
            },
        },
    },
})
