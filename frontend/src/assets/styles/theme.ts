import { createTheme } from '@mui/material/styles'
export const PADDING = 2
export const SPACING = 4

export const smallFontSize = { fontSize: 12.5 }
export const xSmallFontSize = { fontSize: 10.5 }

export const theme = createTheme({
    palette: {
        mode: 'dark',
    },
    spacing: SPACING,
    typography: {
        // Enable responsive font sizes
        fontSize: 14,
        h1: {
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 500,
        },
        h2: {
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 500,
        },
        h3: {
            fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)',
            fontWeight: 500,
        },
        h4: {
            fontSize: 'clamp(1.25rem, 3vw, 2rem)',
            fontWeight: 500,
        },
        body1: {
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
        },
        body2: {
            fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
        },
        subtitle1: {
            fontSize: 'clamp(0.875rem, 2vw, 1rem)',
        },
        subtitle2: {
            fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
        },
    },
    components: {
        MuiCard: {
            styleOverrides: {
                root: {
                    display: 'inline-block',
                    padding: 10,
                },
            },
        },
    },
})

export const PAPER_CARD_COLOR = 'rgba(28, 145, 255, 0.25)'
