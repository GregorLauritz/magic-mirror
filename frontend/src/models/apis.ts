export type QueryParameters = Array<QUERY_PARAM>

export type QUERY_PARAM_VALUE = string | number | boolean

export type QUERY_PARAM = {
    name: string
    value?: QUERY_PARAM_VALUE
}
