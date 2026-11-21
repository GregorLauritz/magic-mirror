import { useState, type SyntheticEvent } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import type { Station } from '@/domain/trains/types'
import { useStationSearch } from './hooks/useStationSearch'

interface StationAutocompleteProps {
    readonly label: string
    readonly value: Station | null
    readonly onChange: (station: Station | null) => void
}

/** Picks a station by searching for it; the chosen one is shown by name. */
export const StationAutocomplete = ({
    label,
    value,
    onChange,
}: StationAutocompleteProps) => {
    // What the user is typing; null while the chosen station is shown instead.
    const [typed, setTyped] = useState<string | null>(null)
    const { stations, isLoading, isError } = useStationSearch(typed ?? '')

    // The chosen station stays selectable even if the search no longer lists it.
    const options =
        value && !stations.some((station) => station.id === value.id)
            ? [value, ...stations]
            : stations

    const handleInputChange = (
        _: SyntheticEvent,
        text: string,
        reason: string
    ) => setTyped(reason === 'input' ? text : null)

    return (
        <Autocomplete
            options={options}
            value={value}
            inputValue={typed ?? value?.name ?? ''}
            loading={isLoading}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, chosen) => option.id === chosen.id}
            filterOptions={(all) => all}
            onChange={(_, station) => {
                setTyped(null)
                onChange(station)
            }}
            onInputChange={handleInputChange}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    error={isError}
                    helperText={isError ? 'Error loading stations' : undefined}
                    slotProps={{
                        ...params.slotProps,
                        input: {
                            ...params.slotProps?.input,
                            autoComplete: 'new-password',
                        },
                        htmlInput: {
                            ...params.slotProps?.htmlInput,
                            autoComplete: 'new-password',
                        },
                    }}
                />
            )}
        />
    )
}
