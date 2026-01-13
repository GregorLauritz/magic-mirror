export type WidgetLayout = {
    i: string
    x: number
    y: number
    w: number
    h: number
}

export type TrainConnection = {
    id: string
    departureStationId: string
    departureStationName: string
    arrivalStationId: string
    arrivalStationName: string
}

export type TrainDisplaySettings = {
    mode: 'carousel' | 'multiple'
    carouselInterval: number // in seconds, default 15
}

export type UserSettings = {
    country: string
    city: string
    zip_code: string
    birthday_cal_id: string
    events_cal_id: string
    widget_layout?: WidgetLayout[]
    // Legacy single train connection fields (deprecated, but kept for backward compatibility)
    train_departure_station_id?: string
    train_departure_station_name?: string
    train_arrival_station_id?: string
    train_arrival_station_name?: string
    // New multi-connection train fields
    train_connections?: TrainConnection[]
    train_display_settings?: TrainDisplaySettings
}
