import { useSearchParams } from 'react-router-dom'
import { describePageError } from './describeError'
import { ErrorView } from './ErrorView'

/** `/error?type=...`: names a known failure, or says it is unknown. */
export const ErrorPage = () => {
    const [params] = useSearchParams()
    return <ErrorView {...describePageError(params.get('type'))} />
}
