/**
 * Types for Deutsche Bahn train data from v6.db.transport.rest API
 */

export interface TrainLocation {
  type: 'location' | 'stop' | 'station';
  id: string;
  name: string;
  latitude?: number;
  longitude?: number;
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

export interface TrainJourney {
  type: 'journey';
  legs: Array<{
    origin: TrainStop;
    destination: TrainStop;
    departure: string;
    arrival: string;
    line?: TrainLine;
    direction?: string;
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
