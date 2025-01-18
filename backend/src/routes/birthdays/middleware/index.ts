import { EParamType } from 'services/validators/parameter_validator';
import { RangeParameterValidator } from 'services/validators/range_parameter_validator';
import { RegexParameterValidator } from 'services/validators/regex_parameter_validator';

const CAL_ID_REGEX = /^.+$/;

const eventCountMiddleware = new RangeParameterValidator('count', { min: 1, max: 100 }, EParamType.query, false);
const calendarIdMiddleware = new RegexParameterValidator('cal_id', CAL_ID_REGEX, EParamType.query, true);

export const birthdayMw = [eventCountMiddleware.validate, calendarIdMiddleware.validate];
