import { USER_SETTINGS_API } from '../constants/api'
import { fetchJson } from '../common/fetch'
import { UserSettings } from '../models/user_settings'
import { SettingsParams } from '../components/settings_form/SettingsForm'

export const putUserSettings = async (
    data: SettingsParams
): Promise<UserSettings> => {
    const settings = await getUserSettingsBody(data)
    const body = JSON.stringify(settings)

    return fetchJson<UserSettings>(
        `${USER_SETTINGS_API}/me`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        },
        [200]
    )
}

const getUserSettingsBody = async (
    data: SettingsParams
): Promise<UserSettings> => {
    return {
        zip_code: data.zipCode,
        country: data.country,
        city: data.city,
        events_cal_id: data.eventsCalId,
        birthday_cal_id: data.birthdayCalId,
        train_connections: data.trainConnections,
        train_display_settings: data.trainDisplaySettings,
    }
}
