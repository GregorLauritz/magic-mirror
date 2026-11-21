/** A number with its unit. `null` means the provider had no value. */
export interface Measurement {
    readonly value: number | null
    readonly unit: string
}
