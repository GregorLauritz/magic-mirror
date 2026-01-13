import { fetchJson } from './fetch';
import { ApiError } from 'models/api/api_error';
import { ApiTrainConnection, ApiTrainStation, TrainDeparture, TrainJourney, TrainLocation } from 'models/api/trains';
import { LOGGER } from './loggers';
import { DB_API_BASE_URL } from 'config';

export class DeutscheBahnService {
  /**
   * Search for train stations by name
   * @param query - Search query (station name)
   * @param results - Maximum number of results (default: 10)
   * @returns Array of matching stations
   */
  static async searchStations(query: string, results: number = 10): Promise<ApiTrainStation[]> {
    try {
      const url = `${DB_API_BASE_URL}/locations?query=${encodeURIComponent(query)}&results=${results}&poi=false&addresses=false`;

      LOGGER.info('Searching for train stations', { query, results, url });

      const response = await fetchJson(url);

      LOGGER.info('Deutsche Bahn API response received', { status: response.status });

      if (!Array.isArray(response.body)) {
        throw new ApiError('Invalid response from Deutsche Bahn API', undefined, 500);
      }

      const locations = response.body as TrainLocation[];

      // Filter to only include stations and stops

      LOGGER.info('Found locations', { count: locations.length });
      const stations: ApiTrainStation[] = locations
        .filter((loc) => loc.type === 'station' || loc.type === 'stop')
        .map((loc) => ({
          id: loc.id,
          name: loc.name,
          latitude: loc.location?.latitude,
          longitude: loc.location?.longitude,
        }));

      return stations;
    } catch (error) {
      LOGGER.error('Error searching train stations', { error, query });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to search train stations', error as Error, 500);
    }
  }

  /**
   * Get upcoming departures from a station
   * @param stationId - Station ID
   * @param duration - Duration in minutes to look ahead (default: 120)
   * @param results - Maximum number of results (default: 20)
   * @returns Array of departures
   */
  static async getDepartures(
    stationId: string,
    duration: number = 120,
    results: number = 20,
  ): Promise<TrainDeparture[]> {
    try {
      const url = `${DB_API_BASE_URL}/stops/${encodeURIComponent(stationId)}/departures?duration=${duration}&results=${results}`;

      LOGGER.info('Getting train departures', { stationId, duration, results, url });

      const response = await fetchJson(url);

      if (!response.body || !Array.isArray(response.body.journeys)) {
        throw new ApiError('Invalid response from Deutsche Bahn API', undefined, 500);
      }

      // Transform journeys into TrainDeparture format
      const departures: TrainDeparture[] = [];

      for (const journey of response.body.journeys) {
        if (!journey.legs || journey.legs.length === 0) {
          continue;
        }

        const firstLeg = journey.legs[0];

        // Skip if missing required data
        if (!firstLeg.origin || !firstLeg.line) {
          continue;
        }

        const departure: TrainDeparture = {
          tripId: journey.refreshToken || `${firstLeg.origin.id}-${firstLeg.departure}`,
          stop: {
            type: firstLeg.origin.type || 'station',
            id: firstLeg.origin.id,
            name: firstLeg.origin.name,
            location: firstLeg.origin.location,
          },
          when: firstLeg.departure,
          plannedWhen: firstLeg.plannedDeparture || firstLeg.departure,
          delay: firstLeg.departureDelay,
          platform: firstLeg.departurePlatform,
          plannedPlatform: firstLeg.plannedDeparturePlatform || firstLeg.departurePlatform,
          direction: firstLeg.direction || firstLeg.destination?.name || 'Unknown',
          line: {
            type: firstLeg.line.type || 'line',
            id: firstLeg.line.id,
            name: firstLeg.line.name,
            mode: firstLeg.line.mode || 'train',
            product: firstLeg.line.product || 'regional',
          },
          remarks: firstLeg.remarks,
        };

        departures.push(departure);
      }

      LOGGER.info('Transformed departures from journeys', { count: departures.length });

      return departures;
    } catch (error) {
      LOGGER.error('Error getting train departures', { error, stationId });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to get train departures', error as Error, 500);
    }
  }

  /**
   * Get train connections between two stations
   * @param fromStationId - Departure station ID
   * @param toStationId - Arrival station ID
   * @param results - Maximum number of results (default: 5)
   * @returns Array of train connections
   */
  static async getConnections(
    fromStationId: string,
    toStationId: string,
    results: number = 5,
  ): Promise<ApiTrainConnection[]> {
    try {
      const url = `${DB_API_BASE_URL}/journeys?from=${encodeURIComponent(fromStationId)}&to=${encodeURIComponent(toStationId)}&results=${results}`;

      LOGGER.info('Getting train connections', { fromStationId, toStationId, results, url });

      const response = await fetchJson(url);

      if (!response.body || !Array.isArray(response.body.journeys)) {
        throw new ApiError('Invalid response from Deutsche Bahn API', undefined, 500);
      }

      const journeys = response.body.journeys as TrainJourney[];

      // Transform journeys into simplified connection objects
      const connections: ApiTrainConnection[] = [];

      for (const journey of journeys) {
        if (!journey.legs || journey.legs.length === 0) {
          continue;
        }

        const firstLeg = journey.legs[0];
        const lastLeg = journey.legs[journey.legs.length - 1];

        const departure = new Date(firstLeg.departure);
        const arrival = new Date(lastLeg.arrival);
        const duration = Math.floor((arrival.getTime() - departure.getTime()) / 1000 / 60); // minutes

        connections.push({
          departure: firstLeg.departure,
          arrival: lastLeg.arrival,
          departureStation: firstLeg.origin.name,
          arrivalStation: lastLeg.destination.name,
          departurePlatform: firstLeg.departurePlatform,
          arrivalPlatform: lastLeg.arrivalPlatform,
          line: firstLeg.line?.name || 'Unknown',
          direction: firstLeg.direction || lastLeg.destination.name,
          delay: firstLeg.departureDelay ?? undefined,
          duration,
        });
      }

      return connections;
    } catch (error) {
      LOGGER.error('Error getting train connections', { error, fromStationId, toStationId });
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to get train connections', error as Error, 500);
    }
  }
}
