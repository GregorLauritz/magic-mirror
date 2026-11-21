import { useCallback, useReducer, useRef, useState } from 'react'
import { useServices } from '@/app/services/useServices'
import type {
    SavedRoute,
    TrainDisplayMode,
} from '@/domain/settings/UserSettings'
import { useApiKeys, useSaveSettings, useSettings } from '@/features/settings'
import {
    describeFieldErrors,
    describeSaveFailure,
    type FieldMessages,
} from './saveMessages'
import {
    formReducer,
    initialFormState,
    toSettingsInput,
    type TextField,
} from './settingsFormState'

export interface FormNotice {
    readonly severity: 'success' | 'info' | 'error'
    readonly message: string
}

// A problem is shown under the field it is about; two inputs share one.
const errorKeyOf = (field: TextField): keyof FieldMessages | undefined => {
    if (field === 'postalCode') return 'city'
    if (field === 'carouselIntervalText') return undefined
    return field
}

/**
 * The settings form: what is being edited, what is wrong with it, and saving
 * it. Everything the user sees about the outcome is data (field messages and
 * a notice), so nothing blocks the page with a dialog.
 */
export const useSettingsForm = () => {
    const settings = useSettings()
    const { apiKeys } = useApiKeys()
    const saveSettings = useSaveSettings()
    const { ids } = useServices()

    // The form starts from what is saved when the page opens; later changes
    // elsewhere (e.g. the dashboard layout) do not overwrite what is typed.
    const [state, dispatch] = useReducer(formReducer, undefined, () =>
        initialFormState(settings, apiKeys)
    )
    const [errors, setErrors] = useState<FieldMessages>({})
    const [saving, setSaving] = useState(false)
    const [notice, setNotice] = useState<FormNotice>()
    const [noticeOpen, setNoticeOpen] = useState(false)
    const inFlight = useRef(false)

    const setText = useCallback((field: TextField, value: string) => {
        dispatch({ type: 'text', field, value })
        const key = errorKeyOf(field)
        if (key !== undefined) {
            setErrors((current) => {
                if (current[key] === undefined) return current
                const next = { ...current }
                delete next[key]
                return next
            })
        }
    }, [])

    const show = (next: FormNotice) => {
        setNotice(next)
        setNoticeOpen(true)
    }

    const submit = useCallback(async () => {
        if (inFlight.current) return
        inFlight.current = true
        setSaving(true)
        setNoticeOpen(false)
        try {
            const result = await saveSettings(toSettingsInput(state))
            if (result.ok) {
                setErrors({})
                show(
                    result.value === 'saved'
                        ? { severity: 'success', message: 'Settings saved' }
                        : { severity: 'info', message: 'No changes to save' }
                )
            } else if (result.error.kind === 'validation') {
                setErrors(describeFieldErrors(result.error.fields))
            } else {
                show({
                    severity: 'error',
                    message: describeSaveFailure(result.error),
                })
            }
        } finally {
            inFlight.current = false
            setSaving(false)
        }
    }, [saveSettings, state])

    return {
        state,
        errors,
        saving,
        notice,
        noticeOpen,
        dismissNotice: useCallback(() => setNoticeOpen(false), []),
        submit,
        setText,
        setTrainMode: useCallback(
            (mode: TrainDisplayMode) => dispatch({ type: 'trainMode', mode }),
            []
        ),
        commitInterval: useCallback(
            () => dispatch({ type: 'commitInterval' }),
            []
        ),
        addRoute: useCallback(
            () => dispatch({ type: 'addRoute', id: ids.next() }),
            [ids]
        ),
        removeRoute: useCallback(
            (id: string) => dispatch({ type: 'removeRoute', id }),
            []
        ),
        updateRoute: useCallback(
            (route: SavedRoute) => dispatch({ type: 'updateRoute', route }),
            []
        ),
    }
}
