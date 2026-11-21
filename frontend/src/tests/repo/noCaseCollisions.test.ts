import { describe, expect, it } from 'vitest'

// B7: modules whose import specifiers differ only by case (for example
// GridEditContext.tsx and gridEditContext.ts) are ambiguous on case-insensitive
// filesystems (macOS, Windows): `import './GridEditContext'` can resolve to the
// wrong file there. Compare the extension-less, lower-cased path.
const specifierOf = (path: string): string =>
    path.replace(/\.[^./]+$/, '').toLowerCase()

describe('repository hygiene: file names', () => {
    it('has no two modules whose import specifiers differ only by case', () => {
        const paths = Object.keys(
            import.meta.glob('/src/**/*', { query: '?url' })
        )
        expect(paths.length).toBeGreaterThan(0)

        const seen = new Map<string, string>()
        const collisions: string[] = []
        for (const path of paths) {
            const key = specifierOf(path)
            const previous = seen.get(key)
            if (previous !== undefined) {
                collisions.push(`${previous} <-> ${path}`)
            } else {
                seen.set(key, path)
            }
        }

        expect(collisions).toEqual([])
    })
})
