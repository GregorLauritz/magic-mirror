import type { FormEvent } from 'react'
import { Alert, Box, Button, Snackbar } from '@mui/material'
import { ApiKeysSection } from './ApiKeysSection'
import { CalendarSection } from './CalendarSection'
import { GoogleAccountSection } from './GoogleAccountSection'
import { LocationSection } from './LocationSection'
import { buttonBoxStyle, parentBoxStyle } from './styles'
import { TrainSection } from './TrainSection'
import { useSettingsForm } from './useSettingsForm'

const NOTICE_DURATION_MS = 6000

interface SettingsPageProps {
    readonly onBack: () => void
}

/** The settings screen: location, Google account, calendars, keys and trains. */
export const SettingsPage = ({ onBack }: SettingsPageProps) => {
    const form = useSettingsForm()
    const { state, errors } = form

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        void form.submit()
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box
                component="form"
                sx={parentBoxStyle}
                noValidate
                autoComplete="off"
                onSubmit={handleSubmit}
            >
                <LocationSection
                    country={state.country}
                    city={state.city}
                    postalCode={state.postalCode}
                    errors={errors}
                    onCountryChange={(value) => form.setText('country', value)}
                    onCityChange={(value) => form.setText('city', value)}
                    onPostalCodeChange={(value) =>
                        form.setText('postalCode', value)
                    }
                />

                <GoogleAccountSection />

                <CalendarSection
                    eventsCalendarId={state.eventsCalendarId}
                    birthdayCalendarId={state.birthdayCalendarId}
                    errors={errors}
                    onEventsCalendarChange={(value) =>
                        form.setText('eventsCalendarId', value)
                    }
                    onBirthdayCalendarChange={(value) =>
                        form.setText('birthdayCalendarId', value)
                    }
                />

                <ApiKeysSection
                    geocodeApiKey={state.geocodeApiKey}
                    error={errors.geocodeApiKey}
                    onGeocodeApiKeyChange={(value) =>
                        form.setText('geocodeApiKey', value)
                    }
                />

                <TrainSection
                    routes={state.trainRoutes}
                    mode={state.trainMode}
                    intervalText={state.carouselIntervalText}
                    onModeChange={form.setTrainMode}
                    onIntervalChange={(text) =>
                        form.setText('carouselIntervalText', text)
                    }
                    onIntervalCommit={form.commitInterval}
                    onAdd={form.addRoute}
                    onRemove={form.removeRoute}
                    onUpdate={form.updateRoute}
                />

                <Box sx={buttonBoxStyle}>
                    <Button
                        type="submit"
                        variant="outlined"
                        disabled={form.saving}
                    >
                        {form.saving ? 'Saving…' : 'Send'}
                    </Button>
                    <Button variant="outlined" onClick={onBack}>
                        Back
                    </Button>
                </Box>
            </Box>

            <Snackbar
                open={form.noticeOpen}
                autoHideDuration={NOTICE_DURATION_MS}
                onClose={(_, reason) => {
                    if (reason !== 'clickaway') form.dismissNotice()
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={form.notice?.severity ?? 'info'}
                    variant="filled"
                    onClose={form.dismissNotice}
                >
                    {form.notice?.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}
