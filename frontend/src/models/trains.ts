export type TrainStation = {
    id: string
    name: string
    latitude?: number
    longitude?: number
}

export type TrainConnection = {
    departure: string
    arrival: string
    departureStation: string
    arrivalStation: string
    departurePlatform?: string
    arrivalPlatform?: string
    line: string
    direction: string
    delay?: number
    duration: number
}
