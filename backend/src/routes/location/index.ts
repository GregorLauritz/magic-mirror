import { getRouter } from 'services/router_factory';
import { RegexParameterValidator } from 'services/validators/regex_parameter_validator';
import { EParamType } from 'services/validators/parameter_validator';
import { fetchJson } from 'services/fetch';
import { NextFunction, Request, Response } from 'express';
import { GeoLocation } from 'models/api/geocode';
import { ApiError } from 'models/api/api_error';
import { GEOCODE_API_KEY, GEOCODE_URL } from 'config';
import { ApiResponse, Json } from 'models/api/fetch';

// Middlewares
const COUNTRY_CODE_REGEX = /^[a-zA-Z]{2}$/;
const ZIP_REGEX = /^\w+$/;
const CITY_REGEX = /^\w+$/;

const countryCodeMiddleware = new RegexParameterValidator('country', COUNTRY_CODE_REGEX, EParamType.query, true);
const zipCodeMiddleware = new RegexParameterValidator('zip_code', ZIP_REGEX, EParamType.query, false);
const cityMiddleware = new RegexParameterValidator('city', CITY_REGEX, EParamType.query, false);

class GeocodingService {
  static buildGeocodeUrl(req: Request): string {
    const params = new URLSearchParams({
      country: req.query.country as string,
      api_key: GEOCODE_API_KEY,
    });

    if (req.query.zip_code) {
      params.append('postalcode', req.query.zip_code as string);
    }
    if (req.query.city) {
      params.append('city', req.query.city as string);
    }

    return `${GEOCODE_URL}/search?${params.toString()}`;
  }

  static async fetchGeocodeData(url: string): Promise<ApiResponse<Json>> {
    return fetchJson(url);
  }

  static parseGeocodeResponse(response: ApiResponse<Json>): GeoLocation {
    if (!Array.isArray(response.body) || response.body.length === 0) {
      throw new ApiError(response.body?.reason ?? 'Geolocation could not be found', undefined, 404);
    }

    const responseBody = response.body;

    const mostImportantResult = responseBody.reduce((prev, current) => {
      return current.importance > prev.importance ? current : prev;
    }, responseBody[0]);

    return {
      longitude: mostImportantResult.lon,
      latitude: mostImportantResult.lat,
    };
  }
}

// Route Handler
async function getGeocodeOfAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const url = GeocodingService.buildGeocodeUrl(req);
    const response = await GeocodingService.fetchGeocodeData(url);
    const coordinates = GeocodingService.parseGeocodeResponse(response);
    res.status(200).json(coordinates);
  } catch (err) {
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError('Error processing geocoding request', err as Error, 500));
    }
  }
}

const router = getRouter();

router.get(
  '/geocode',
  [countryCodeMiddleware.validate, zipCodeMiddleware.validate, cityMiddleware.validate],
  getGeocodeOfAddress,
);

export default router;
