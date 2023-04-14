import { CALENDAR_CONFIG } from "config/google";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "models/api/api_error";
import { EventRequestParams } from "models/api/calendar";
import { GoogleUser } from "models/api/express_user";
import { getBirthdayEvents } from "routes/birthdays/services";


export const allBirthdays = async (req: Request, res: Response, next: NextFunction) => {
    return getBirthdayApiRequestParams(parseInt((req.query.count || CALENDAR_CONFIG.DEFAULT_EVENT_COUNT).toString()))
        .then(params => getBirthdayEvents(req.user as GoogleUser, params))
        .then(birthdays => res.status(200).json(birthdays))
        .catch((err) => next(new ApiError("Error while retrieving calendar events", err, 500)))
}

const getBirthdayApiRequestParams = async (maxResults = 1): Promise<EventRequestParams> => {
    const minTime = (new Date()).toISOString();
    return {
        maxResults,
        minTime,
        maxTime: undefined
    }
}