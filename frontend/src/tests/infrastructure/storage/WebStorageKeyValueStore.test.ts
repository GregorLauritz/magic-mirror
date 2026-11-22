import { describe, expect, it } from 'vitest'
import { WebStorageKeyValueStore } from '@/infrastructure/storage/WebStorageKeyValueStore'

// An in-memory Storage that can be told to fail like a full or disabled one.
class MemoryStorage implements Storage {
    private data = new Map<string, string>()
    failing = false

    get length(): number {
        this.check()
        return this.data.size
    }
    private check() {
        if (this.failing) throw new DOMException('denied', 'SecurityError')
    }
    key(index: number): string | null {
        this.check()
        return [...this.data.keys()][index] ?? null
    }
    getItem(key: string): string | null {
        this.check()
        return this.data.get(key) ?? null
    }
    setItem(key: string, value: string): void {
        this.check()
        this.data.set(key, value)
    }
    removeItem(key: string): void {
        this.check()
        this.data.delete(key)
    }
    clear(): void {
        this.data.clear()
    }
}

describe('WebStorageKeyValueStore', () => {
    it('reads, writes, removes and lists keys', () => {
        const store = new WebStorageKeyValueStore(() => new MemoryStorage())
        const storage = new MemoryStorage()
        const shared = new WebStorageKeyValueStore(() => storage)

        expect(shared.set('a', '1')).toBe(true)
        expect(shared.set('b', '2')).toBe(true)
        expect(shared.get('a')).toBe('1')
        expect(shared.get('missing')).toBeNull()
        expect(shared.keys()).toEqual(['a', 'b'])

        shared.remove('a')

        expect(shared.get('a')).toBeNull()
        expect(shared.keys()).toEqual(['b'])
        expect(store.keys()).toEqual([]) // a different storage is a different store
    })

    it('never throws when the storage is full or disabled', () => {
        const storage = new MemoryStorage()
        const store = new WebStorageKeyValueStore(() => storage)
        storage.failing = true

        expect(store.get('a')).toBeNull()
        expect(store.set('a', '1')).toBe(false)
        expect(() => store.remove('a')).not.toThrow()
        expect(store.keys()).toEqual([])
    })

    it('never throws when merely obtaining the storage throws (blocked cookies)', () => {
        const store = new WebStorageKeyValueStore(() => {
            throw new DOMException('denied', 'SecurityError')
        })

        expect(store.get('a')).toBeNull()
        expect(store.set('a', '1')).toBe(false)
        expect(() => store.remove('a')).not.toThrow()
        expect(store.keys()).toEqual([])
    })
})
