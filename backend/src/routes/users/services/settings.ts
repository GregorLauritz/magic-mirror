import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { ApiDtoUserSettings } from 'models/api/user_settings';
import { DtoUserSettings, IDtoUserSettings } from 'models/mongo/user_settings';
import { getUserId } from 'services/headers';
import { LOGGER } from 'services/loggers';

export const getUserSettingsFromDb = async (sub: string): Promise<IDtoUserSettings | null> => {
  LOGGER.info(`Get user ${sub} from DB`);
  return DtoUserSettings.findOne({ sub });
};

export const deleteUserSettingsFromDb = async (sub: string) => {
  return DtoUserSettings.deleteOne({ sub });
};

export const updateExistingUserSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userSettings: IDtoUserSettings,
) => {
  const payload = req.body as Partial<ApiDtoUserSettings>;
  return updateUserSettingsinDb(userSettings, payload)
    .then(parseUserSettings)
    .then((u) => res.status(200).json(u))
    .catch((err) => next(new ApiError('Error while updating user settings', err, 500)));
};

export const createNewUserSettings = async (req: Request, res: Response, next: NextFunction) => {
  const payload = req.body as ApiDtoUserSettings;
  return getUserId(req.headers)
    .then((sub) => createNewUserSettingsinDb(sub, payload))
    .then(parseUserSettings)
    .then((u) => res.status(201).json(u))
    .catch((err) => next(new ApiError('Error while updating user settings', err, 500)));
};

export const updateUserSettingsinDb = async (
  userSettings: IDtoUserSettings,
  newUserSettings: Partial<ApiDtoUserSettings>,
): Promise<IDtoUserSettings> => {
  userSettings.zip_code = newUserSettings.zip_code ?? userSettings.zip_code;
  userSettings.country = newUserSettings.country ?? userSettings.country;
  userSettings.city = newUserSettings.city ?? userSettings.city;
  userSettings.events_cal_id = newUserSettings.events_cal_id ?? userSettings.events_cal_id;
  userSettings.birthday_cal_id = newUserSettings.birthday_cal_id ?? userSettings.birthday_cal_id;
  return userSettings.save().then(logUserSettingsUpdate);
};

export const createNewUserSettingsinDb = async (
  sub: string,
  newUserSettings: ApiDtoUserSettings,
): Promise<IDtoUserSettings> => {
  const userSettings = new DtoUserSettings({
    zip_code: newUserSettings.zip_code,
    country: newUserSettings.country,
    city: newUserSettings.city,
    events_cal_id: newUserSettings.events_cal_id,
    birthday_cal_id: newUserSettings.birthday_cal_id,
    sub,
  });
  return userSettings.save().then((settings) => logUserSettingsUpdate(settings as IDtoUserSettings));
};

const logUserSettingsUpdate = async (userSettings: IDtoUserSettings): Promise<IDtoUserSettings> => {
  LOGGER.info(`Created/updated settings for user ${userSettings.sub}`);
  return userSettings;
};

export const parseUserSettings = async (userSettings: IDtoUserSettings): Promise<ApiDtoUserSettings> => {
  return {
    zip_code: userSettings.zip_code,
    country: userSettings.country,
    city: userSettings.city,
    events_cal_id: userSettings.events_cal_id,
    birthday_cal_id: userSettings.birthday_cal_id,
  };
};
