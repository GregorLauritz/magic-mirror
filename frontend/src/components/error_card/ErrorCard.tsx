import { Button, Stack, Typography } from '@mui/material'
import { LargeCard, MediumCard, SmallCard } from '../CardFrame'
import { useNavigate } from 'react-router-dom'

type Props = {
    Card: typeof MediumCard | typeof SmallCard | typeof LargeCard
    showSettingsBtn: boolean
    error: Error | string
}

function ErrorCard({ Card, showSettingsBtn, error }: Readonly<Props>) {
    const navigate = useNavigate()
    return (
        <Card>
            <Stack spacing={1}>
                <Typography variant="h6">Unexpected error</Typography>
                <Typography variant="subtitle2" color={'red'}>
                    {error.toString()}
                </Typography>
                {showSettingsBtn && (
                    <Stack sx={{ alignItems: 'center' }}>
                        <Button
                            onClick={() => navigate('/settings')}
                            variant="outlined"
                        >
                            Settings
                        </Button>
                    </Stack>
                )}
            </Stack>
        </Card>
    )
}

export default ErrorCard
