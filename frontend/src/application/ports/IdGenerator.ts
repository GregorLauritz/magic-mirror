/** Makes identifiers for things the user creates (e.g. a train connection). */
export interface IdGenerator {
    next(): string
}
