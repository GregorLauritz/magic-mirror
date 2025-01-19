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

  async updateSettings(sub: string, updates: Partial<ApiDtoUserSettings>): Promise<ApiDtoUserSettings | null> {
    const existingSettings = await this.repository.get(sub);
    if (!existingSettings) return null;
    const updatedSettings = await this.repository.update(existingSettings, updates);
    return this.parseUserSettings(updatedSettings);
  }

  async createSettings(sub: string, newSettings: ApiDtoUserSettings): Promise<ApiDtoUserSettings> {
    const createdSettings = await this.repository.create(sub, newSettings);
    return this.parseUserSettings(createdSettings);
  }

  async deleteSettings(sub: string): Promise<void> {
    await this.repository.delete(sub);
  }

  private parseUserSettings(userSettings: IDtoUserSettings): ApiDtoUserSettings {
    return {
      zip_code: userSettings.zip_code,
      country: userSettings.country,
      city: userSettings.city,
      events_cal_id: userSettings.events_cal_id,
      birthday_cal_id: userSettings.birthday_cal_id,
    };
  }
}

// Controller Layer
const userSettingsRepository = new UserSettingsRepository();
const userSettingsService = new UserSettingsService(userSettingsRepository);

const getMeUserSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await getUserId(req.headers);
    const userSettings = await userSettingsService.getSettings(sub);
    if (!userSettings) {
      return res.status(404).send('User settings not found');
    }
    res.status(200).json(userSettings);
  } catch (err) {
    next(new ApiError('Error while retrieving user settings', err as Error, 500));
  }
};

const patchMeUserSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await getUserId(req.headers);
    const updatedSettings = await userSettingsService.updateSettings(sub, req.body);
    if (!updatedSettings) {
      return next(new ApiError('User settings not found', undefined, 404));
    }
    res.status(200).json(updatedSettings);
  } catch (err) {
    next(new ApiError('Error updating settings', err as Error, 500));
  }
};

const postUserSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await getUserId(req.headers);
    const newSettings = await userSettingsService.createSettings(sub, req.body);
    res.status(201).json(newSettings);
  } catch (err) {
    next(new ApiError('Error creating user settings', err as Error, 500));
  }
};

const deleteMeUserSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sub = await getUserId(req.headers);
    await userSettingsService.deleteSettings(sub);
    res.status(204).send();
  } catch (err) {
    next(new ApiError('Error while deleting user settings', err as Error, 500));
  }
};

export { postUserSettings, deleteMeUserSettings, getMeUserSettings, patchMeUserSettings };
