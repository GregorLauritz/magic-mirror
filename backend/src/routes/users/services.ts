import { ApiDtoUserSettings } from 'models/api/user_settings';
import { DtoUserSettings, IDtoUserSettings } from 'models/mongo/user_settings';
import { DtoUser } from 'models/mongo/users';
import { LOGGER } from 'services/loggers';

/**
 * Repository for user settings database operations
 * Handles CRUD operations for user settings in MongoDB
 */
export class UserSettingsRepository {
  /**
   * Retrieves user settings by user ID
   * @param sub - User's Google subject identifier
   * @returns User settings document or null if not found
   */
  async get(sub: string): Promise<IDtoUserSettings | null> {
    LOGGER.info(`Fetching settings for user ${sub}`);
    return DtoUserSettings.findOne({ sub });
  }

  /**
   * Deletes user settings by user ID
   * @param sub - User's Google subject identifier
   */
  async delete(sub: string): Promise<void> {
    LOGGER.info(`Deleting settings for user ${sub}`);
    await DtoUserSettings.deleteOne({ sub });
  }

  /**
   * Creates or updates user settings (upsert operation)
   * If settings exist, updates them. If not, creates new settings.
   * @param sub - User's Google subject identifier
   * @param settings - Settings data to create or update
   * @returns Created or updated settings document
   */
  async upsert(sub: string, settings: ApiDtoUserSettings): Promise<IDtoUserSettings> {
    const result = await DtoUserSettings.findOneAndUpdate(
      { sub },
      {
        $set: {
          zip_code: settings.zip_code,
          country: settings.country,
          city: settings.city,
          events_cal_id: settings.events_cal_id,
          birthday_cal_id: settings.birthday_cal_id,
        },
      },
      {
        upsert: true, // Create if not exists
        new: true, // Return the updated document
        runValidators: true, // Run schema validators
      },
    );

    LOGGER.info(`Upserted settings for user ${sub}`);
    return result!;
  }
}

/**
 * Repository for user database operations
 * Handles user account data in MongoDB
 */
export class UserRepository {
  /**
   * Deletes a user account by user ID
   * @param sub - User's Google subject identifier
   */
  async delete(sub: string): Promise<void> {
    LOGGER.info(`Deleting user ${sub}`);
    await DtoUser.deleteOne({ sub });
  }
}
