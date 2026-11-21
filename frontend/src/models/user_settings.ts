// Shapes still used by the legacy settings form and dashboard grid. The settings
// themselves live in the domain (src/domain/settings); these go away with the
// form and the dashboard rebuild (steps S9 and S10).
export type WidgetLayout = {
    i: string
    x: number
    y: number
    w: number
    h: number
}

export type TrainConnection = {
    id: string
    departure_station_id: string
    departure_station_name: string
    arrival_station_id: string
    arrival_station_name: string
}

export type TrainDisplaySettings = {
    mode: 'carousel' | 'multiple'
    carousel_interval: number // in seconds, default 15
}
