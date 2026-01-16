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

export type UserSettings = {
    country: string
    city: string
    zip_code: string
    birthday_cal_id: string
    events_cal_id: string
    widget_layout?: WidgetLayout[]
    train_connections?: TrainConnection[]
    train_display_settings?: TrainDisplaySettings
}
