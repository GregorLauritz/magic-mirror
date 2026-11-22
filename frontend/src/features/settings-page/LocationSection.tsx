import { Box, TextField } from '@mui/material'
import { CountrySelect } from './CountrySelect'
import { countryBoxStyle, inputBoxStyle } from './styles'

interface LocationSectionProps {
    readonly country: string
    readonly city: string
    readonly postalCode: string
    readonly errors: { readonly country?: string; readonly city?: string }
    readonly onCountryChange: (code: string) => void
    readonly onCityChange: (city: string) => void
    readonly onPostalCodeChange: (postalCode: string) => void
}

/** Where the mirror is: the address the weather is for. */
export const LocationSection = ({
    country,
    city,
    postalCode,
    errors,
    onCountryChange,
    onCityChange,
    onPostalCodeChange,
}: LocationSectionProps) => (
    <>
        <Box sx={countryBoxStyle}>
            <CountrySelect
                value={country}
                onChange={onCountryChange}
                error={errors.country}
            />
        </Box>
        <Box sx={inputBoxStyle}>
            <TextField
                id="city"
                label="City"
                variant="outlined"
                value={city}
                onChange={(event) => onCityChange(event.target.value)}
                error={errors.city !== undefined}
                helperText={errors.city}
            />
            <TextField
                id="zip"
                label="Zip Code"
                variant="outlined"
                value={postalCode}
                onChange={(event) => onPostalCodeChange(event.target.value)}
            />
        </Box>
    </>
)
