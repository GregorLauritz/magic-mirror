import { v4 as uuidv4 } from 'uuid'
import type { IdGenerator } from '@/application/ports/IdGenerator'

/** Random (version 4) UUIDs; works in non-secure contexts too, unlike crypto.randomUUID. */
export class UuidIdGenerator implements IdGenerator {
    next(): string {
        return uuidv4()
    }
}
