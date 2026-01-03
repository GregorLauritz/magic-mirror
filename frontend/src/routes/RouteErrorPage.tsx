import { useRouteError } from 'react-router-dom'
import { ErrorComponent } from '../components/error_component/ErrorComponent'

type ErrorType = {
    title?: string
    details?: string
    backTo?: string
}

type RouterError = {
    status?: number
    statusText?: string
    message?: string
}

const getErrorDetails = (status: number): ErrorType => {
    switch (status) {
        case 401: {
            return {
                title: 'Not signed in!',
                details: 'You are not signed in... Please sign in first!',
                backTo: '/',
            }
        }
        case 404: {
            return {
                title: 'Page not found!',
                details: 'The page you are looking for does not exist!',
            }
        }
        case 500: {
            return {
                title: 'Server error!',
                details: 'Issue on the server side... Please try again soon!',
            }
        }
        default: {
            return {
                title: 'Unknown error!',
                details: 'We have no idea what happened... Please try again!',
            }
        }
    }
}

export default function RouteErrorPage() {
    const error = useRouteError() as RouterError
    const status = error.status ?? 500
    const details = getErrorDetails(status)

    return (
        <ErrorComponent
            title={details.title}
            details={details.details}
            navigateBackTo={details.backTo ?? -1}
        />
    )
}
