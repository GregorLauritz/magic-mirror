import { Box } from '@mui/material'
import {
    SettingsForm,
    SettingsParams,
} from '../components/settings_form/SettingsForm'
import { useNavigate } from 'react-router-dom'
import { useGetUserSettings } from '../apis/user_settings'
import { putUserSettings } from '../apis/users'
import { useListCalendars } from '../apis/calendar_list'
import { UserSettings } from '../models/user_settings'
import { memo, useCallback } from 'react'

const DEFAULT_CITY = 'Stuttgart'
const DEFAULT_COUNTRY = 'DE'
const DEFAULT_ZIP_CODE = '70176'

const inputHasChanged = (
    data: SettingsParams,
    userSettings?: UserSettings
): boolean => {
    const { country, city, zipCode, eventsCalId, birthdayCalId } = data
    return (
        country !== userSettings?.country ||
        city !== userSettings?.city ||
        zipCode !== userSettings?.zip_code ||
        eventsCalId !== userSettings?.events_cal_id ||
        birthdayCalId !== userSettings?.birthday_cal_id
    )
}

const SettingsComponent = () => {
    const navigate = useNavigate()

    const {
        data: userSettings,
        isLoading,
        error,
        refetch,
    } = useGetUserSettings(true)

    const {
        data: calList,
        isLoading: calIsLoading,
        error: calError,
    } = useListCalendars()

    const updateSettings = useCallback(
        (data: SettingsParams) => {
            if (inputHasChanged(data, userSettings)) {
                putUserSettings(data)
                    .then(() => refetch())
                    .catch(alert)
            }
        },
        [userSettings, refetch]
    )

    const handleBack = useCallback(() => {
        navigate('/')
    }, [navigate])

    if (isLoading || calIsLoading) return <Box>Loading...</Box>

    if (calError || !calList) {
        return <Box>Error: {error?.message ?? calError?.message}</Box>
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <SettingsForm
                defaults={{
                    country: userSettings?.country ?? DEFAULT_COUNTRY,
                    city: userSettings?.city ?? DEFAULT_CITY,
                    zipCode: userSettings?.zip_code ?? DEFAULT_ZIP_CODE,
                    birthdayCalId: userSettings?.birthday_cal_id ?? '',
                    eventsCalId: userSettings?.events_cal_id ?? '',
                }}
                onBack={handleBack}
                showBackButton={error == null}
                onSend={updateSettings}
                calendars={calList}
            />
        </Box>
    )
}

export const Settings = memo(SettingsComponent)
Settings.displayName = 'Settings'
