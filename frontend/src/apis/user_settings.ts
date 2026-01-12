import { useQuery, UseQueryResult } from 'react-query'
import { fetchJson } from '../common/fetch'
import { ServerStateKeysEnum } from '../common/statekeys'
import { USER_SETTINGS_API } from '../constants/api'
import { UserSettings } from '../models/user_settings'

export const useGetUserSettings = (
    allowNotFound = false
): UseQueryResult<UserSettings, Error> =>
    useQuery<UserSettings, Error>({
        queryKey: [ServerStateKeysEnum.user_settings, allowNotFound],
        queryFn: async (): Promise<UserSettings> =>
            fetchJson<UserSettings>(
                `${USER_SETTINGS_API}/me`,
                undefined,
                allowNotFound ? [200, 404] : [200]
            ),
        refetchInterval: false,
    })

export const patchUserSettings = async (
    data: Partial<UserSettings>
): Promise<UserSettings> => {
    const body = JSON.stringify(data)

    return fetchJson<UserSettings>(
        `${USER_SETTINGS_API}/me`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        },
        [200]
    )
}
