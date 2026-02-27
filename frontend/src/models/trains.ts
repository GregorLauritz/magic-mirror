export type TrainStation = {
    id: string
    name: string
    latitude?: number
    longitude?: number
}

export type TrainLeg = {
    departure: string
    arrival: string
    departureStation: string
    arrivalStation: string
    line?: string
    direction?: string
    departurePlatform?: string
    arrivalPlatform?: string
    delay?: number
    duration: number
    walking: boolean
    cancelled: boolean
    distance?: number
}

export type TrainConnection = {
    departure: string
    arrival: string
    departureStation: string
    arrivalStation: string
    departurePlatform?: string
    arrivalPlatform?: string
    delay?: number
    duration: number
    legs: TrainLeg[]
}
