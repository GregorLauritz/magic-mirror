import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// The architecture is visible in the folder structure; these tests keep it
// from drifting back to a bag of loose directories. (Who may import whom is
// enforced by ESLint, see eslint.config.mjs.)
const SRC = path.resolve(import.meta.dirname, '../..')

const directoriesIn = (dir: string): string[] =>
    readdirSync(dir).filter((name) =>
        statSync(path.join(dir, name)).isDirectory()
    )

describe('source layout', () => {
    it('has only the layers at the top of src', () => {
        expect(directoriesIn(SRC).sort()).toEqual([
            'app',
            'application',
            'assets',
            'domain',
            'features',
            'infrastructure',
            'shared',
            'tests',
        ])
    })

    it('gives every feature a barrel, the only door other features may use', () => {
        const features = directoriesIn(path.join(SRC, 'features'))

        expect(features.length).toBeGreaterThan(0)
        for (const feature of features) {
            const entries = readdirSync(path.join(SRC, 'features', feature))
            expect(entries, `features/${feature} has no index.ts`).toContain(
                'index.ts'
            )
        }
    })

    it('mirrors the layers in the tests', () => {
        const tested = directoriesIn(path.join(SRC, 'tests'))

        for (const layer of [
            'app',
            'application',
            'domain',
            'features',
            'infrastructure',
            'shared',
        ]) {
            expect(tested, `no tests/${layer}`).toContain(layer)
        }
    })
})
