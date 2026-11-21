import type { PlainDate } from '@/domain/shared/time'

export interface Birthday {
    readonly name: string
    readonly date: PlainDate
}
