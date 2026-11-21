import { fixupConfigRules } from '@eslint/compat'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'
import importPlugin from 'eslint-plugin-import'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
})

// ── Architecture boundaries (hexagonal layers) ──────────────────────────────
//
//   domain  <-  application  <-  infrastructure   (dependencies point inwards)
//   shared / features (presentation) use domain + application, never
//   infrastructure; only `app/` (the composition root) may import everything.
//
// Directories that still hold the pre-refactor code. The new layers must not
// depend on them; they disappear in the last migration step.
const layer = (name) => `./src/${name}`
const LEGACY_DIRS = [
    'components',
    'apis',
    'services',
    'hooks',
    'common',
    'models',
    'routes',
    'constants',
    'types',
].map(layer)

const NO_LEGACY = 'New layers must not import the legacy directories.'

const pureLayerZones = [
    {
        target: layer('domain'),
        from: [
            layer('application'),
            layer('infrastructure'),
            layer('features'),
            layer('shared'),
            layer('app'),
            ...LEGACY_DIRS,
        ],
        message: 'domain is pure: it may only import from domain.',
    },
    {
        target: layer('application'),
        from: [
            layer('infrastructure'),
            layer('features'),
            layer('shared'),
            layer('app'),
            ...LEGACY_DIRS,
        ],
        message: 'application may only import from domain and application.',
    },
    {
        target: layer('infrastructure'),
        from: [
            layer('features'),
            layer('shared'),
            layer('app'),
            ...LEGACY_DIRS,
        ],
        message:
            'infrastructure adapters may only import from domain and application.',
    },
]

const presentationZones = [
    {
        target: layer('shared'),
        from: [layer('infrastructure'), layer('features'), ...LEGACY_DIRS],
        message: `shared UI must not import infrastructure or features. ${NO_LEGACY}`,
    },
    {
        target: layer('shared'),
        from: layer('app'),
        except: ['./services'],
        message: 'shared may only use app/services (useServices).',
    },
    {
        target: layer('features'),
        from: [layer('infrastructure'), ...LEGACY_DIRS],
        message: `features must reach infrastructure through ports, via useServices(). ${NO_LEGACY}`,
    },
    {
        target: layer('features'),
        from: layer('app'),
        except: ['./services', './routes.ts'],
        message: 'features may only use app/services and app/routes.',
    },
]

// Ambient/impure APIs that business logic must receive through ports instead
// (Clock, Scheduler, HttpClient, KeyValueStore, ...), so it stays testable.
const AMBIENT_GLOBALS = [
    'window',
    'document',
    'localStorage',
    'sessionStorage',
    'fetch',
    'navigator',
    'location',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
].map((name) => ({
    name,
    message: `Use the matching port (Clock, Scheduler, HttpClient, KeyValueStore, ...) instead of the ambient "${name}".`,
}))

const FRAMEWORK_IMPORTS = {
    paths: [
        'react',
        'react-dom',
        'react-query',
        'luxon',
        'moment',
        'uuid',
    ].map((name) => ({
        name,
        message: `domain/application must stay framework-free (no "${name}").`,
    })),
    patterns: [
        {
            group: [
                'react/*',
                'react-dom/*',
                'react-router*',
                '@mui/*',
                '@emotion/*',
            ],
            message: 'domain/application must stay framework-free.',
        },
    ],
}

const NON_DETERMINISTIC_SYNTAX = [
    {
        selector: "NewExpression[callee.name='Date'][arguments.length=0]",
        message: 'Inject a Clock instead of calling new Date().',
    },
    {
        selector:
            "CallExpression[callee.object.name='Date'][callee.property.name='now']",
        message: 'Inject a Clock instead of calling Date.now().',
    },
    {
        selector:
            "CallExpression[callee.object.name='Math'][callee.property.name='random']",
        message: 'Inject an IdGenerator instead of calling Math.random().',
    },
]

export default [
    {
        ignores: [
            '**/dist',
            '**/.eslintrc.cjs',
            '**/node_modules',
            '**/nginx',
            '**/docker',
            '**/public',
        ],
    },
    ...fixupConfigRules(
        compat.extends(
            'eslint:recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:react-hooks/recommended'
        )
    ),
    {
        plugins: {
            'react-refresh': reactRefresh,
        },

        languageOptions: {
            globals: {
                ...globals.browser,
            },

            parser: tsParser,
        },

        rules: {
            'react-refresh/only-export-components': [
                'warn',
                {
                    allowConstantExport: true,
                },
            ],
        },
    },
    // ── Architecture boundaries ──────────────────────────────────────────────
    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: { import: importPlugin },
        settings: {
            'import/resolver': {
                typescript: {
                    project: path.join(__dirname, 'tsconfig.json'),
                },
            },
            'import/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx'],
            },
        },
        rules: {
            // Circular imports undermine the layering (and cause load-order
            // bugs); `import type` cycles are ignored by the rule.
            'import/no-cycle': 'error',
        },
    },
    {
        // The inner layers are born clean, so their rules are errors from day one.
        files: [
            'src/domain/**/*.{ts,tsx}',
            'src/application/**/*.{ts,tsx}',
            'src/infrastructure/**/*.{ts,tsx}',
        ],
        rules: {
            'import/no-restricted-paths': [
                'error',
                { basePath: __dirname, zones: pureLayerZones },
            ],
        },
    },
    {
        // Presentation layers start as warnings while legacy code is migrated;
        // the final migration step flips them to errors.
        files: ['src/features/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
        rules: {
            'import/no-restricted-paths': [
                'warn',
                { basePath: __dirname, zones: presentationZones },
            ],
            'no-restricted-globals': ['warn', ...AMBIENT_GLOBALS],
            'no-restricted-imports': [
                'warn',
                {
                    patterns: [
                        {
                            group: ['@/features/*/*'],
                            message:
                                'Import another feature only through its barrel (@/features/<name>).',
                        },
                        {
                            group: ['@/infrastructure', '@/infrastructure/*'],
                            message:
                                'Presentation code reaches infrastructure through useServices().',
                        },
                    ],
                },
            ],
        },
    },
    {
        files: ['src/domain/**/*.{ts,tsx}', 'src/application/**/*.{ts,tsx}'],
        rules: {
            'no-restricted-globals': ['error', ...AMBIENT_GLOBALS],
            'no-restricted-imports': ['error', FRAMEWORK_IMPORTS],
            'no-restricted-syntax': ['error', ...NON_DETERMINISTIC_SYNTAX],
            'no-console': 'error',
        },
    },
    {
        files: ['src/tests/**/*.ts', 'src/tests/**/*.tsx'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
]
