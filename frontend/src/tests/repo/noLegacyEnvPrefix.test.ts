/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

// B8: Vite only exposes variables prefixed with VITE_ to client code, so any
// import.meta.env.REACT_APP_* read is always undefined (a leftover from
// Create React App). Configuration must go through VITE_* names (see
// src/app/config.ts).
//
// The files are read with node:fs on purpose: importing them through Vite
// (e.g. `import.meta.glob(..., { query: '?raw' })`) would register every
// source file as an already-loaded module and hide untested files from the
// coverage report.
const SRC_DIR = resolve(import.meta.dirname, '../..')
const SOURCE_FILE = /\.(ts|tsx)$/

const applicationSources = (): string[] =>
    readdirSync(SRC_DIR, { recursive: true, encoding: 'utf8' })
        .map((relative) => relative.replaceAll('\\', '/'))
        .filter((relative) => SOURCE_FILE.test(relative))
        .filter((relative) => !relative.startsWith('tests/'))

describe('repository hygiene: environment variables', () => {
    it('does not read REACT_APP_* variables in application sources', () => {
        const files = applicationSources()
        expect(files.length).toBeGreaterThan(0)

        const offenders = files.filter((relative) =>
            readFileSync(resolve(SRC_DIR, relative), 'utf8').includes(
                'REACT_APP_'
            )
        )

        expect(offenders).toEqual([])
    })
})
