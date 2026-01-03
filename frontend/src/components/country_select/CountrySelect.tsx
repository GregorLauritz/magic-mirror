import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import { SyntheticEvent } from 'react'
import { countries, CountryType } from './countries'

type Props = {
    inputCallback?: (val: string) => void
    defaultCountryCode?: string
}

export default function CountrySelect({
    inputCallback,
    defaultCountryCode,
}: Readonly<Props>) {
    const onChange = (
        _event: SyntheticEvent<Element, Event>,
        value: CountryType | null
    ) => {
        if (inputCallback) inputCallback(value?.code ?? '')
    }

    return (
        <Autocomplete
            id="country-select"
            sx={{ width: '50ch' }}
            options={countries}
            value={countries.find((x) => x.code === defaultCountryCode)}
            autoHighlight
            onChange={onChange}
            getOptionLabel={(option) => option.label}
            renderOption={(props, option) => (
                <Box
                    component="li"
                    sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                    {...props}
                >
                    <img
                        loading="lazy"
                        width="20"
                        src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                        srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                        alt=""
                    />
                    {option.label} ({option.code})
                </Box>
            )}
            renderInput={(params) => (
                <TextField
                    {...params}
                    label="Country"
                    inputProps={{
                        ...params.inputProps,
                        autoComplete: 'new-password', // disable autocomplete and autofill
                    }}
                />
            )}
        />
    )
}
