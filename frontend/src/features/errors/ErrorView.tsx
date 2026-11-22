import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useNavigate } from 'react-router-dom'
import errorImage from '@/assets/error.png'
import type { BackTarget } from './describeError'
import { cardStyle } from './style'

interface ErrorViewProps {
    readonly title: string
    readonly details: string
    readonly backTo: BackTarget
}

/** An error as a card: what happened, details on demand, and a way out. */
export const ErrorView = ({ title, details, backTo }: ErrorViewProps) => {
    const navigate = useNavigate()
    const back = () => {
        if (typeof backTo === 'number') navigate(backTo)
        else navigate(backTo)
    }

    return (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card sx={cardStyle}>
                <CardMedia
                    component="img"
                    src={errorImage}
                    alt="Error"
                    loading="lazy"
                    height={200}
                    sx={{ objectFit: 'contain' }}
                />
                <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom>
                        {title}
                    </Typography>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="error-details-content"
                            id="error-details-header"
                        >
                            <Typography>Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography color="text.secondary">
                                {details}
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </CardContent>
                <CardActions sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button variant="outlined" onClick={back}>
                        Back
                    </Button>
                </CardActions>
            </Card>
        </Box>
    )
}
