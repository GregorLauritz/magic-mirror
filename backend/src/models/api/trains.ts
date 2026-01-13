/**
 * Types for Deutsche Bahn train data from v6.db.transport.rest API
 */

export interface TrainLocationCoordinates {
  type: string;
  id: string;
  latitude: number;
  longitude: number;
}

export interface TrainLocation {
  type: 'location' | 'stop' | 'station';
  id: string;
  name: string;
  location?: TrainLocationCoordinates;
  // Some stops have a nested station object
  station?: TrainLocation;
}

export interface TrainLine {
  type: string;
  id?: string;
  name: string;
  mode: string;
  product: string;
}

export interface TrainStop {
  stop: TrainLocation;
  departure?: string;
  departureDelay?: number;
  departurePlatform?: string;
  arrival?: string;
  arrivalDelay?: number;
  arrivalPlatform?: string;
}

export interface TrainDeparture {
  tripId: string;
  stop: TrainLocation;
  when: string;
  plannedWhen: string;
  delay?: number;
  platform?: string;
  plannedPlatform?: string;
  direction: string;
  line: TrainLine;
  remarks?: Array<{
    type: string;
    code?: string;
    text: string;
  }>;
}

export interface TrainLeg {
  origin: TrainLocation;
  destination: TrainLocation;
  departure: string;
  plannedDeparture: string;
  departureDelay?: number | null;
  arrival: string;
  plannedArrival: string;
  arrivalDelay?: number | null;
  tripId?: string;
  line?: TrainLine;
  direction?: string;
  departurePlatform?: string;
  plannedDeparturePlatform?: string;
  arrivalPlatform?: string;
  plannedArrivalPlatform?: string;
  remarks?: Array<{
    type: string;
    code?: string;
    text: string;
    summary?: string;
    priority?: number;
  }>;
  loadFactor?: string;
}

export interface TrainJourney {
  type: 'journey';
  legs: TrainLeg[];
  refreshToken?: string;
  remarks?: Array<{
    type: string;
    code?: string;
    text: string;
  }>;
  price?: {
    amount: number;
    currency: string;
  };
}

// Simplified response types for frontend
export interface ApiTrainStation {
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface ApiTrainConnection {
  departure: string;
  arrival: string;
  departureStation: string;
  arrivalStation: string;
  departurePlatform?: string;
  arrivalPlatform?: string;
  line: string;
  direction: string;
  delay?: number;
  duration: number;
}
