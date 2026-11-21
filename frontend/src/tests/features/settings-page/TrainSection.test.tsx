import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrainSection } from '@/features/settings-page/TrainSection'
import type { SavedRoute } from '@/domain/settings/UserSettings'
import { createTestContainer } from '../../support/createTestContainer'
import { FakeTrainProvider } from '../../support/FakeTrainProvider'
import { renderWithDeps } from '../../support/renderWithDeps'

const route = (id: string): SavedRoute => ({
    id,
    from: { id: `${id}-a`, name: `${id} Start` },
    to: { id: `${id}-b`, name: `${id} End` },
})

const setup = (
    props: Partial<React.ComponentProps<typeof TrainSection>> = {},
    provider = new FakeTrainProvider({ stations: [] })
) => {
    const handlers = {
        onModeChange: vi.fn(),
        onIntervalChange: vi.fn(),
        onIntervalCommit: vi.fn(),
        onAdd: vi.fn(),
        onRemove: vi.fn(),
        onUpdate: vi.fn(),
    }
    const test = createTestContainer({ trainProvider: provider })
    const user = userEvent.setup()
    renderWithDeps(
        <TrainSection
            routes={[]}
            mode="carousel"
            intervalText="15"
            {...handlers}
            {...props}
        />,
        { deps: test.deps }
    )
    return { ...handlers, user, test }
}

describe('TrainSection', () => {
    it('is titled as optional', () => {
        setup()

        expect(
            screen.getByText('Train Connections (optional)')
        ).toBeInTheDocument()
    })

    describe('display mode', () => {
        it('shows the current mode and reports a change', async () => {
            const { user, onModeChange } = setup()
            expect(
                screen.getByText('Carousel (rotate through connections)')
            ).toBeInTheDocument()

            await user.click(
                screen.getByRole('combobox', { name: 'Display Mode' })
            )
            await user.click(
                await screen.findByRole('option', { name: /Multiple Cards/ })
            )

            expect(onModeChange).toHaveBeenCalledWith('multiple')
        })
    })

    describe('carousel interval', () => {
        it('shows the text as typed and reports each change', () => {
            const { onIntervalChange } = setup({ intervalText: '1' })
            const field = screen.getByLabelText('Carousel Interval (seconds)')
            expect(field).toHaveValue(1)

            fireEvent.change(field, { target: { value: '12' } })

            expect(onIntervalChange).toHaveBeenCalledWith('12')
        })

        it('reports when the field is left, so the value can be corrected then', () => {
            const { onIntervalCommit } = setup()
            const field = screen.getByLabelText('Carousel Interval (seconds)')

            fireEvent.blur(field)

            expect(onIntervalCommit).toHaveBeenCalledTimes(1)
        })

        it('is switched off for multiple cards', () => {
            setup({ mode: 'multiple' })

            expect(
                screen.getByLabelText('Carousel Interval (seconds)')
            ).toBeDisabled()
        })
    })

    describe('connections', () => {
        it('shows both stations of every connection', () => {
            setup({ routes: [route('r1'), route('r2')] })

            expect(
                screen
                    .getAllByLabelText('Departure Station')
                    .map((e) => (e as HTMLInputElement).value)
            ).toEqual(['r1 Start', 'r2 Start'])
            expect(
                screen
                    .getAllByLabelText('Arrival Station')
                    .map((e) => (e as HTMLInputElement).value)
            ).toEqual(['r1 End', 'r2 End'])
        })

        it('removes a connection by its own button', async () => {
            const { user, onRemove } = setup({
                routes: [route('r1'), route('r2')],
            })

            await user.click(
                screen.getAllByRole('button', { name: 'Remove connection' })[1]
            )

            expect(onRemove).toHaveBeenCalledWith('r2')
        })

        it('offers to add a connection, counting up to the maximum', async () => {
            const { user, onAdd } = setup({ routes: [route('r1')] })

            await user.click(
                screen.getByRole('button', {
                    name: 'Add Train Connection (1/5)',
                })
            )

            expect(onAdd).toHaveBeenCalledTimes(1)
        })

        it('offers no more once the maximum is reached', () => {
            setup({ routes: ['1', '2', '3', '4', '5'].map(route) })

            expect(
                screen.queryByRole('button', { name: /Add Train Connection/ })
            ).not.toBeInTheDocument()
        })

        it('reports a changed departure station with the rest of the connection intact', async () => {
            const stations = [{ id: 'new-id', name: 'New Hbf' }]
            const { user, onUpdate, test } = setup(
                { routes: [route('r1')] },
                new FakeTrainProvider({ stations })
            )

            const field = screen.getByLabelText('Departure Station')
            await user.clear(field)
            await user.type(field, 'New')
            act(() => test.scheduler.advance(300))
            await user.click(
                await screen.findByRole('option', { name: 'New Hbf' })
            )

            expect(onUpdate).toHaveBeenLastCalledWith({
                id: 'r1',
                from: { id: 'new-id', name: 'New Hbf' },
                to: { id: 'r1-b', name: 'r1 End' },
            })
        })

        it('reports a cleared station as empty', async () => {
            const { user, onUpdate } = setup({ routes: [route('r1')] })
            const editor = screen
                .getByLabelText('Arrival Station')
                .closest('.MuiAutocomplete-root') as HTMLElement

            await user.click(within(editor).getByTitle('Clear'))

            expect(onUpdate).toHaveBeenLastCalledWith({
                id: 'r1',
                from: { id: 'r1-a', name: 'r1 Start' },
                to: { id: '', name: '' },
            })
        })
    })
})
