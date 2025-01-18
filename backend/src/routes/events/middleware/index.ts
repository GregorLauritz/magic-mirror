import { isDate, isIso8601DatetimeString } from 'services/dateParser';
import { CustomParameterValidator } from 'services/validators/custom_parameter_validator';
import { EParamType } from 'services/validators/parameter_validator';
import { RangeParameterValidator } from 'services/validators/range_parameter_validator';

const eventCountMiddleware = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, false);

const minTimeMiddleware = new CustomParameterValidator('minTime', isIso8601DatetimeString, EParamType.query, false);

const maxTimeMiddleware = new CustomParameterValidator('maxTime', isIso8601DatetimeString, EParamType.query, false);

const dateMiddleware = new CustomParameterValidator('date', isDate, EParamType.request, false);

export const allEventsMw = [eventCountMiddleware.validate, minTimeMiddleware.validate, maxTimeMiddleware.validate];

export const dateEventsMw = [eventCountMiddleware.validate, dateMiddleware.validate];
