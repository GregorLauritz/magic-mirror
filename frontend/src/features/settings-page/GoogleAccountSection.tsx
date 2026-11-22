import { Box, Button } from '@mui/material'
import { useAuth } from '@/features/auth'
import { sectionHeaderStyle } from './styles'

/** Signing in with Google, which the calendar widgets need. */
export const GoogleAccountSection = () => {
    const { isSignedIn, isSigningIn, error, signIn, signOut } = useAuth()

    return (
        <>
            <Box sx={sectionHeaderStyle}>
                Google Account
                {isSignedIn ? (
                    <Button size="small" onClick={signOut}>
                        Sign out
                    </Button>
                ) : (
                    <Button
                        size="small"
                        disabled={isSigningIn}
                        onClick={signIn}
                    >
                        {isSigningIn ? 'Signing in…' : 'Sign in with Google'}
                    </Button>
                )}
            </Box>
            {error && (
                <Box sx={{ textAlign: 'center', color: 'error.main' }}>
                    {error}
                </Box>
            )}
        </>
    )
}
