export type WidgetLayout = {
    i: string
    x: number
    y: number
    w: number
    h: number
}

export type UserSettings = {
    country: string
    city: string
    zip_code: string
    birthday_cal_id: string
    events_cal_id: string
    widget_layout?: WidgetLayout[]
}
