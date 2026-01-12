import { getRouter } from 'services/router_factory';
import { RegexParameterValidator } from 'services/validators/regex_parameter_validator';
import { RangeParameterValidator } from 'services/validators/range_parameter_validator';
import { EParamType } from 'services/validators/parameter_validator';
import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { DeutscheBahnService } from 'services/deutsche_bahn';

// Validators
const queryValidator = new RegexParameterValidator('query', /^.{2,}$/, EParamType.query, true);

const stationIdValidator = new RegexParameterValidator(
  'stationId',
  /^[\w-]+$/,
  EParamType.query,
  true,
);

const fromStationIdValidator = new RegexParameterValidator(
  'from',
  /^[\w-]+$/,
  EParamType.query,
  true,
);

const toStationIdValidator = new RegexParameterValidator('to', /^[\w-]+$/, EParamType.query, true);

const resultsValidator = new RangeParameterValidator(
  'results',
  { min: 1, max: 50 },
  EParamType.query,
  false,
);

const durationValidator = new RangeParameterValidator(
  'duration',
  { min: 10, max: 720 },
  EParamType.query,
  false,
);

/**
 * GET /api/trains/stations
 * Search for train stations by name
 * Query params:
 *   - query: string (required, min 2 chars)
 *   - results: number (optional, 1-50, default 10)
 */
async function searchStations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = req.query.query as string;
    const results = req.query.results ? parseInt(req.query.results as string, 10) : 10;

    const stations = await DeutscheBahnService.searchStations(query, results);

    res.status(200).json(stations);
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError('Error searching train stations', err as Error, 500));
    }
  }
}

/**
 * GET /api/trains/departures
 * Get upcoming departures from a station
 * Query params:
 *   - stationId: string (required)
 *   - duration: number (optional, 10-720 minutes, default 120)
 *   - results: number (optional, 1-50, default 20)
 */
async function getDepartures(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stationId = req.query.stationId as string;
    const duration = req.query.duration ? parseInt(req.query.duration as string, 10) : 120;
    const results = req.query.results ? parseInt(req.query.results as string, 10) : 20;

    const departures = await DeutscheBahnService.getDepartures(stationId, duration, results);

    res.status(200).json(departures);
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError('Error getting train departures', err as Error, 500));
    }
  }
}

/**
 * GET /api/trains/connections
 * Get train connections between two stations
 * Query params:
 *   - from: string (required, departure station ID)
 *   - to: string (required, arrival station ID)
 *   - results: number (optional, 1-50, default 5)
 */
async function getConnections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;
    const results = req.query.results ? parseInt(req.query.results as string, 10) : 5;

    const connections = await DeutscheBahnService.getConnections(from, to, results);

    res.status(200).json(connections);
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError('Error getting train connections', err as Error, 500));
    }
  }
}

const router = getRouter();

router.get('/stations', [queryValidator.validate, resultsValidator.validate], searchStations);

router.get(
  '/departures',
  [stationIdValidator.validate, durationValidator.validate, resultsValidator.validate],
  getDepartures,
);

router.get(
  '/connections',
  [fromStationIdValidator.validate, toStationIdValidator.validate, resultsValidator.validate],
  getConnections,
);

export default router;
