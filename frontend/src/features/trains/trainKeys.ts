// Query keys of the trains feature.
export const trainKeys = {
    journeys: (fromId: string, toId: string) =>
        ['trains', 'journeys', fromId, toId] as const,
    stations: (query: string) => ['trains', 'stations', query] as const,
}
