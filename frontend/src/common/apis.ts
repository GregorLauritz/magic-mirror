import { QUERY_PARAM, QueryParameters } from '../models/apis'

export const buildQuery = async (
    query_params: QueryParameters = []
): Promise<string> => {
    if (query_params.length === 0) return ''
    const queryParams = query_params
        .map((p) => buildQueryParam(p))
        .filter(isQueryParam)
        .join('&')
    return queryParams.length > 0 ? `?${queryParams}` : ''
}

const buildQueryParam = (query_param: QUERY_PARAM) => {
    if (
        query_param.value !== undefined &&
        query_param.value !== null &&
        String(query_param.value).trim().length > 0
    ) {
        return `${query_param.name}=${query_param.value}`
    }
}

const isQueryParam = (item: string | undefined): item is string => {
    return !!item
}
