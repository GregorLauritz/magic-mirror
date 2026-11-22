import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog'

const setup = (open = true) => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
        <ConfirmDialog
            open={open}
            title="Delete everything?"
            message="This cannot be undone."
            confirmLabel="Delete"
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    )
    return { onConfirm, onCancel, user: userEvent.setup() }
}

describe('ConfirmDialog', () => {
    it('asks with a title and an explanation', () => {
        setup()

        expect(
            screen.getByRole('dialog', { name: 'Delete everything?' })
        ).toHaveAccessibleDescription('This cannot be undone.')
    })

    it('is not there while closed', () => {
        setup(false)

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('confirms with its own label', async () => {
        const { user, onConfirm, onCancel } = setup()

        await user.click(screen.getByRole('button', { name: 'Delete' }))

        expect(onConfirm).toHaveBeenCalledTimes(1)
        expect(onCancel).not.toHaveBeenCalled()
    })

    it('cancels with the button and with Escape', async () => {
        const { user, onCancel, onConfirm } = setup()

        await user.click(screen.getByRole('button', { name: 'Cancel' }))
        await user.keyboard('{Escape}')

        expect(onCancel).toHaveBeenCalledTimes(2)
        expect(onConfirm).not.toHaveBeenCalled()
    })

    it('puts the focus on Cancel, so a stray Enter does not destroy anything', () => {
        setup()

        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    })
})
