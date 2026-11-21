import { Box } from '@mui/material'
import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '@/features/settings'
import { SettingsForm } from '../components/settings_form/SettingsForm'
import { toFormDefaults } from '../components/settings_form/formAdapter'

const SettingsComponent = () => {
    const navigate = useNavigate()
    const settings = useSettings()

    const handleBack = useCallback(() => {
        navigate('/')
    }, [navigate])

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <SettingsForm
                defaults={toFormDefaults(settings)}
                onBack={handleBack}
                showBackButton
            />
        </Box>
    )
}

export const Settings = memo(SettingsComponent)
Settings.displayName = 'Settings'
