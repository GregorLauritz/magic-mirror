import { USER_SETTINGS_API } from '../constants/api'
import { fetchJson } from '../common/fetch'
import { UserSettings } from '../models/user_settings'
import { SettingsParams } from '../components/settings_form/SettingsForm'

export const postUserSettings = async (data: SettingsParams) => {
    return getUserSettingsBody(data)
        .then((settings) => JSON.stringify(settings))
        .then((settings) =>
            fetchJson(
                USER_SETTINGS_API,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: settings,
                },
                [201]
            )
        )
}

export const patchUserSettings = async (data: SettingsParams) => {
    return getUserSettingsBody(data)
        .then((settings) => JSON.stringify(settings))
        .then((settings) =>
            fetchJson(
                `${USER_SETTINGS_API}/me`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: settings,
                },
                [200]
            )
        )
}

const getUserSettingsBody = async (
    data: SettingsParams
): Promise<Partial<UserSettings>> => {
    return {
        zip_code: data.zipCode,
        country: data.country,
        city: data.city,
        events_cal_id: data.eventsCalId,
        birthday_cal_id: data.birthdayCalId,
    }
}
