import { ApiDtoUserSettings } from 'models/api/user_settings';
import { DtoUserSettings, IDtoUserSettings } from 'models/mongo/user_settings';
import { DtoUser } from 'models/mongo/users';
import { LOGGER } from 'services/loggers';

class UserSettingsRepository {
  async get(sub: string): Promise<IDtoUserSettings | null> {
    LOGGER.info(`Get user ${sub} from DB`);
    return DtoUserSettings.findOne({ sub });
  }

  async delete(sub: string): Promise<void> {
    await DtoUserSettings.deleteOne({ sub });
  }

  async update(userSettings: IDtoUserSettings, newSettings: Partial<ApiDtoUserSettings>): Promise<IDtoUserSettings> {
    userSettings.zip_code = newSettings.zip_code ?? userSettings.zip_code;
    userSettings.country = newSettings.country ?? userSettings.country;
    userSettings.city = newSettings.city ?? userSettings.city;
    userSettings.events_cal_id = newSettings.events_cal_id ?? userSettings.events_cal_id;
    userSettings.birthday_cal_id = newSettings.birthday_cal_id ?? userSettings.birthday_cal_id;
    return userSettings.save().then(this.logUserSettingsUpdate);
  }

  async create(sub: string, newSettings: ApiDtoUserSettings): Promise<IDtoUserSettings> {
    const userSettings = new DtoUserSettings({
      zip_code: newSettings.zip_code,
      country: newSettings.country,
      city: newSettings.city,
      events_cal_id: newSettings.events_cal_id,
      birthday_cal_id: newSettings.birthday_cal_id,
      sub,
    });
    return userSettings.save().then((settings) => this.logUserSettingsUpdate(settings as IDtoUserSettings));
  }

  private async logUserSettingsUpdate(userSettings: IDtoUserSettings): Promise<IDtoUserSettings> {
    LOGGER.info(`Created/updated settings for user ${userSettings.sub}`);
    return userSettings;
  }
}

class UserRepository {
  async delete(sub: string): Promise<void> {
    await DtoUser.deleteOne({ sub });
  }
}

export { UserSettingsRepository, UserRepository };
