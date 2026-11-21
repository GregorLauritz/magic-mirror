import { useMemo } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import { findCountryCode } from '@/domain/location/countries'
import { useLocale } from '@/features/time'
import { buildCountryOptions } from './countryOptions'

interface CountrySelectProps {
    /** An ISO country code, or empty. */
    readonly value: string
    readonly onChange: (code: string) => void
    readonly error?: string
}

/** Picks a country by name; the value is its ISO code. */
export const CountrySelect = ({
    value,
    onChange,
    error,
}: CountrySelectProps) => {
    const locale = useLocale()
    const options = useMemo(() => buildCountryOptions(locale), [locale])
    const code = findCountryCode(value)
    const selected = options.find((option) => option.code === code) ?? null

    return (
        <Autocomplete
            id="country-select"
            sx={{ width: '50ch' }}
            options={options}
            value={selected}
            autoHighlight
            onChange={(_, option) => onChange(option?.code ?? '')}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, chosen) =>
                option.code === chosen.code
            }
            renderOption={({ key, ...props }, option) => (
                <li key={key} {...props}>
                    {`${option.flag} ${option.name} (${option.code})`}
                </li>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Country"
                    error={error !== undefined}
                    helperText={error}
                    slotProps={{
                        ...params.slotProps,
                        htmlInput: {
                            ...params.slotProps?.htmlInput,
                            autoComplete: 'new-password', // disable autocomplete and autofill
                        },
                    }}
                />
            )}
        />
    )
}
