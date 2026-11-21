import { memo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsPage } from '@/features/settings-page'

const SettingsComponent = () => {
    const navigate = useNavigate()
    const handleBack = useCallback(() => navigate('/'), [navigate])

    return <SettingsPage onBack={handleBack} />
}

export const Settings = memo(SettingsComponent)
Settings.displayName = 'Settings'
