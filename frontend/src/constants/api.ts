export const API_BACKEND_CONTEXT = import.meta.env.API_BACKEND_CONTEXT ?? 'api'
export const BACKEND_BASE_URL = `/${API_BACKEND_CONTEXT.replace(
    /^\/(.*)$/,
    '$1'
)}`
const WEATHER_ENDPOINT_CONTEXT = 'weather'
const AUTH_CONTEXT = 'auth'
const BIRTHDAY_ENDPOINT_CONTEXT = 'birthdays'
const EVENTS_ENDPOINT_CONTEXT = 'events'
const CALENDARS_ENDPOINT_CONTEXT = 'calendars'
const TASKS_ENDPOINT_CONTEXT = 'tasks'
const USERS_CONTEXT = 'users'
const USER_SETTINGS_CONTEXT = `${USERS_CONTEXT}/settings`
export const WEATHER_API = `${BACKEND_BASE_URL}/${WEATHER_ENDPOINT_CONTEXT}`
export const BIRHTDAY_API = `${BACKEND_BASE_URL}/${BIRTHDAY_ENDPOINT_CONTEXT}`
export const USERS_API = `${BACKEND_BASE_URL}/${USERS_CONTEXT}`
export const USER_SETTINGS_API = `${BACKEND_BASE_URL}/${USER_SETTINGS_CONTEXT}`
export const EVENTS_API = `${BACKEND_BASE_URL}/${EVENTS_ENDPOINT_CONTEXT}`
export const CALENDARS_API = `${BACKEND_BASE_URL}/${CALENDARS_ENDPOINT_CONTEXT}`
export const TASKS_API = `${BACKEND_BASE_URL}/${TASKS_ENDPOINT_CONTEXT}`
export const SESSION_STATUS_API = `${BACKEND_BASE_URL}/${AUTH_CONTEXT}/check`
export const LOGIN_URL = `${BACKEND_BASE_URL}/${AUTH_CONTEXT}/login`
export const REGISTER_URL = `${BACKEND_BASE_URL}/${AUTH_CONTEXT}/register`
export const LOGOUT_URL = `/oauth2/sign_out`
export const LOCATION_API = `${BACKEND_BASE_URL}/location`
export const DEFAULT_FETCH_CONFIG: RequestInit = { credentials: 'include' }
export const REFETCH_INTERVAL = parseInt(
    import.meta.env.REACT_APP_REFRESH_MILLIS ?? '120000'
)
