import { NextFunction, Request, Response } from 'express';
import { ApiError } from 'models/api/api_error';
import { ApiDtoUserSettings } from 'models/api/user_settings';
import { IDtoUserSettings } from 'models/mongo/user_settings';
import { getUserId } from 'services/headers';
import { UserSettingsRepository } from './services';

// Service Layer: Business Logic
class UserSettingsService {
  private readonly repository: UserSettingsRepository;

  constructor(repository: UserSettingsRepository) {
    this.repository = repository;
  }

  async getSettings(sub: string): Promise<ApiDtoUserSettings | null> {
    const userSettings = await this.repository.get(sub);
    return userSettings ? this.parseUserSettings(userSettings) : null;
  }

  async upsertSettings(sub: string, settings: ApiDtoUserSettings): Promise<ApiDtoUserSettings> {
    const upsertedSettings = await this.repository.upsert(sub, settings);
    return this.parseUserSettings(upsertedSettings);
  }

  async deleteSettings(sub: string): Promise<void> {
    await this.repository.delete(sub);
  }

  async patchSettings(sub: string, settings: Partial<ApiDtoUserSettings>): Promise<ApiDtoUserSettings | null> {
    const patchedSettings = await this.repository.patch(sub, settings);
    return patchedSettings ? this.parseUserSettings(patchedSettings) : null;
  }

  private parseUserSettings(userSettings: IDtoUserSettings): ApiDtoUserSettings {
    return {
      zip_code: userSettings.zip_code,
      country: userSettings.country,
      city: userSettings.city,
      events_cal_id: userSettings.events_cal_id,
      birthday_cal_id: userSettings.birthday_cal_id,
      widget_layout: userSettings.widget_layout,
      train_connections: userSettings?.train_connections,
      train_display_settings: userSettings?.train_display_settings || {
        mode: 'carousel',
        carouselInterval: 15,
      },
    };
  }
}

// Controller Layer
const userSettingsRepository = new UserSettingsRepository();
const userSettingsService = new UserSettingsService(userSettingsRepository);

const getMeUserSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sub = getUserId(req.headers);
    const userSettings = await userSettingsService.getSettings(sub);
    if (!userSettings) {
      res.status(404).json({ error: 'User settings not found' });
      return;
    }
    res.status(200).json(userSettings);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError('Error retrieving user settings', err as Error, 500));
  }
};

const putMeUserSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sub = getUserId(req.headers);
    const upsertedSettings = await userSettingsService.upsertSettings(sub, req.body);
    res.status(200).json(upsertedSettings);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError('Error saving user settings', err as Error, 500));
  }
};

const deleteMeUserSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sub = getUserId(req.headers);
    await userSettingsService.deleteSettings(sub);
    res.status(204).send();
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError('Error deleting user settings', err as Error, 500));
  }
};

const patchMeUserSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sub = getUserId(req.headers);
    const patchedSettings = await userSettingsService.patchSettings(sub, req.body);
    if (!patchedSettings) {
      res.status(404).json({ error: 'User settings not found' });
      return;
    }
    res.status(200).json(patchedSettings);
  } catch (err) {
    next(err instanceof ApiError ? err : new ApiError('Error patching user settings', err as Error, 500));
  }
};

export { deleteMeUserSettings, getMeUserSettings, patchMeUserSettings, putMeUserSettings };
