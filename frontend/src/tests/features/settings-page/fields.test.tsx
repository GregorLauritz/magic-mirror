import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarIdField } from '@/features/settings-page/CalendarIdField'
import { CountrySelect } from '@/features/settings-page/CountrySelect'
import { renderWithDeps } from '../../support/renderWithDeps'

const CALENDARS = [
    { id: 'work@x', name: 'Work', primary: false },
    { id: 'primary', name: 'Me', primary: true },
]

describe('CountrySelect', () => {
    const setup = (value: string, error?: string) => {
        const onChange = vi.fn()
        const user = userEvent.setup()
        renderWithDeps(
            <CountrySelect value={value} onChange={onChange} error={error} />,
            {
                testContainer: { config: { locale: 'en-US' } },
            }
        )
        return { onChange, user, input: () => screen.getByRole('combobox') }
    }

    it('shows the name of the chosen country', () => {
        expect(setup('DE').input()).toHaveValue('Germany')
    })

    it('reads a code in any letter case', () => {
        expect(setup('fr').input()).toHaveValue('France')
    })

    it('shows nothing for a code it does not know', () => {
        expect(setup('ZZ').input()).toHaveValue('')
    })

    it('offers countries by their name, with flag and code, and reports the code', async () => {
        const { onChange, user, input } = setup('')

        await user.type(input(), 'Franc')
        await user.click(await screen.findByRole('option', { name: /France/ }))

        expect(
            screen.queryByRole('option', { name: /Germany/ })
        ).not.toBeInTheDocument()
        expect(onChange).toHaveBeenCalledWith('FR')
    })

    it('shows the flag next to the name in the list', async () => {
        const { user, input } = setup('')

        await user.type(input(), 'Japan')

        expect(
            await screen.findByRole('option', { name: '🇯🇵 Japan (JP)' })
        ).toBeInTheDocument()
    })

    it('reports an empty code when cleared', async () => {
        const { onChange, user } = setup('DE')

        await user.click(screen.getByTitle('Clear'))

        expect(onChange).toHaveBeenCalledWith('')
    })

    it('shows its error', () => {
        const { input } = setup('', 'Country must not be empty!')

        expect(
            screen.getByText('Country must not be empty!')
        ).toBeInTheDocument()
        expect(input()).toHaveAttribute('aria-invalid', 'true')
    })

    it('loads no image from another site (the flags are emoji)', () => {
        setup('DE')

        expect(document.querySelectorAll('img')).toHaveLength(0)
    })
})

describe('CalendarIdField', () => {
    const setup = (value: string, error?: string) => {
        const onChange = vi.fn()
        const user = userEvent.setup()
        renderWithDeps(
            <CalendarIdField
                id="cal"
                label="Events Calendar ID"
                calendars={CALENDARS}
                value={value}
                onChange={onChange}
                error={error}
            />
        )
        return { onChange, user, input: () => screen.getByRole('combobox') }
    }

    it('shows the name of a known calendar', () => {
        expect(setup('work@x').input()).toHaveValue('Work')
    })

    it('shows an id that is not in the list as it is (typed before signing in)', () => {
        expect(setup('someone@else').input()).toHaveValue('someone@else')
    })

    it('reports the id of a calendar picked from the list', async () => {
        const { onChange, user, input } = setup('')

        await user.click(input())
        await user.click(await screen.findByRole('option', { name: 'Work' }))

        expect(onChange).toHaveBeenLastCalledWith('work@x')
    })

    it('reports free text as the id while typing', async () => {
        const { onChange, user, input } = setup('')

        await user.type(input(), 'abc')

        expect(onChange).toHaveBeenLastCalledWith('abc')
    })

    it('reports an empty id when cleared (the legacy field ignored the clear button)', async () => {
        const { onChange, user } = setup('work@x')

        await user.click(screen.getByTitle('Clear'))

        expect(onChange).toHaveBeenCalledWith('')
    })

    it('shows its error', () => {
        const { input } = setup('', 'Events Calendar must not be empty!')

        expect(
            screen.getByText('Events Calendar must not be empty!')
        ).toBeInTheDocument()
        expect(input()).toHaveAttribute('aria-invalid', 'true')
    })
})
