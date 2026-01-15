import { Autocomplete, TextField } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TrainStation } from '../../models/trains'
import { TRAINS_API } from '../../constants/api'

interface StationAutocompleteProps {
    label: string
    value: TrainStation | null
    onChange: (station: TrainStation | null) => void
}

export const StationAutocomplete = ({
    label,
    value,
    onChange,
}: StationAutocompleteProps) => {
    const [options, setOptions] = useState<TrainStation[]>([])
    const [inputValue, setInputValue] = useState(value?.name ?? '')
    const [loading, setLoading] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Sync input value when the external value changes (e.g., on initial load)
    useEffect(() => {
        setInputValue(value?.name ?? '')
    }, [value?.id, value?.name])

    const searchStations = useCallback(async (query: string) => {
        if (query.length < 2) {
            setOptions([])
            return
        }

        setLoading(true)
        try {
            const response = await fetch(
                `${TRAINS_API}/stations?query=${encodeURIComponent(query)}&results=10`
            )
            if (response.ok) {
                const stations: TrainStation[] = await response.json()
                setOptions(stations)
            }
        } catch (error) {
            console.error('Error searching stations:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleInputChange = useCallback(
        (_: React.SyntheticEvent, newInputValue: string, reason: string) => {
            // Clear any pending timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }

            // Only update input value and search when user is typing
            if (reason === 'input') {
                setInputValue(newInputValue)
                timeoutRef.current = setTimeout(() => {
                    searchStations(newInputValue)
                }, 300)
            }
            // When a selection is made or cleared, the value prop will update
            // and the useEffect will sync the inputValue
        },
        [searchStations]
    )

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    // Ensure the selected value is always in the options list
    const displayOptions = value
        ? options.some((o) => o.id === value.id)
            ? options
            : [value, ...options]
        : options

    return (
        <Autocomplete
            options={displayOptions}
            value={value}
            inputValue={inputValue}
            loading={loading}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            filterOptions={(x) => x}
            onChange={(_, newValue) => {
                // Immediately update input value for responsiveness
                setInputValue(newValue?.name ?? '')
                onChange(newValue)
            }}
            onInputChange={handleInputChange}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    slotProps={{
                        input: {
                            ...params.InputProps,
                            autoComplete: 'new-password',
                        },
                        htmlInput: {
                            ...params.inputProps,
                            autoComplete: 'new-password',
                        },
                    }}
                />
            )}
        />
    )
}
