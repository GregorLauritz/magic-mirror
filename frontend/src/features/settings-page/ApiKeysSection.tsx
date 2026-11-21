import { Box, Link, TextField } from '@mui/material'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useServices } from '@/app/services/useServices'
import { inputBoxStyle, sectionHeaderStyle } from './styles'

interface ApiKeysSectionProps {
    readonly geocodeApiKey: string
    readonly error?: string
    readonly onGeocodeApiKeyChange: (key: string) => void
}

/** The keys the user supplies themselves, with a link on how to get them. */
export const ApiKeysSection = ({
    geocodeApiKey,
    error,
    onGeocodeApiKeyChange,
}: ApiKeysSectionProps) => {
    const { config } = useServices()

    return (
        <Box>
            <Box sx={sectionHeaderStyle}>
                API Keys
                <Link
                    href={config.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="How to get these API keys"
                >
                    <OpenInNewIcon fontSize="small" />
                </Link>
            </Box>
            <Box sx={inputBoxStyle}>
                <TextField
                    id="geocode-api-key"
                    label="Geocode Maps API Key"
                    variant="outlined"
                    value={geocodeApiKey}
                    onChange={(event) =>
                        onGeocodeApiKeyChange(event.target.value)
                    }
                    error={error !== undefined}
                    helperText={error}
                />
            </Box>
        </Box>
    )
}
