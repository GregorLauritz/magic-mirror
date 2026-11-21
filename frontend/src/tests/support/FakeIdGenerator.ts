import type { IdGenerator } from '@/application/ports/IdGenerator'

/** Predictable ids: "id-1", "id-2", ... */
export class FakeIdGenerator implements IdGenerator {
    private count = 0

    next(): string {
        return `id-${++this.count}`
    }
}
