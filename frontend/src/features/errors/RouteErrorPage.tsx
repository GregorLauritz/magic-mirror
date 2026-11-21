import { useRouteError } from 'react-router-dom'
import { describeRouteError } from './describeError'
import { ErrorView } from './ErrorView'

/** What the router shows when a page is missing or throws. */
export const RouteErrorPage = () => (
    <ErrorView {...describeRouteError(useRouteError())} />
)
