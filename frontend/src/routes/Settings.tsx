import { Box } from '@mui/material'
import {
    SettingsForm,
    SettingsParams,
} from '../components/settings_form/SettingsForm'
import { useNavigate } from 'react-router-dom'
import { useGetUserSettings } from '../apis/user_settings'
import { patchUserSettings } from '../apis/users'
import { useListCalendars } from '../apis/calendar_list'

const city = 'Stuttgart'
const country = 'DE'
const zipCode = '70176'

export const Settings = () => {
    const navigate = useNavigate()

    const {
        data: userSettings,
        isLoading,
        error,
        refetch,
    } = useGetUserSettings(false)

    const {
        data: calList,
        isLoading: calIsLoading,
        error: calError,
    } = useListCalendars()

    const updateSettings = (data: SettingsParams) => {
        if (inputHasChanged(data)) {
            patchUserSettings(data)
                .then(() => refetch())
                .catch(alert)
        }
    }

    const inputHasChanged = (data: SettingsParams): boolean => {
        const { country, city, zipCode, eventsCalId, birthdayCalId } = data
        return (
            country !== userSettings?.country ||
            city !== userSettings?.city ||
            zipCode !== userSettings?.zip_code ||
            eventsCalId !== userSettings?.events_cal_id ||
            birthdayCalId !== userSettings?.birthday_cal_id
        )
    }

    const back = () => navigate('/')

    if (isLoading || calIsLoading) return <Box>Loading...</Box>

    if (error || calError || !calList) {
        return <Box>Error: {error?.message ?? calError?.message}</Box>
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <SettingsForm
                defaults={{
                    country: userSettings?.country ?? country,
                    city: userSettings?.city ?? city,
                    zipCode: userSettings?.zip_code ?? zipCode,
                    birthdayCalId: userSettings?.birthday_cal_id ?? '',
                    eventsCalId: userSettings?.events_cal_id ?? '',
                }}
                onBack={back}
                showBackButton={error == null}
                onSend={updateSettings}
                calendars={calList}
            />
        </Box>
    )
}
