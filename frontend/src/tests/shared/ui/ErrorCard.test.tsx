import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router-dom'
import ErrorCard from '@/shared/ui/ErrorCard'
import { MediumCard } from '@/shared/ui/CardFrame'
import { renderWithDeps } from '../../support/renderWithDeps'

const Path = () => <div data-testid="path">{useLocation().pathname}</div>

describe('ErrorCard', () => {
    it('shows the message', () => {
        renderWithDeps(
            <ErrorCard
                Card={MediumCard}
                error="Something is off"
                showSettingsBtn={false}
            />
        )

        expect(screen.getByText('Unexpected error')).toBeInTheDocument()
        expect(screen.getByText('Something is off')).toBeInTheDocument()
        expect(
            screen.queryByRole('button', { name: 'Settings' })
        ).not.toBeInTheDocument()
    })

    it('shows an Error by its text', () => {
        renderWithDeps(
            <ErrorCard
                Card={MediumCard}
                error={new Error('boom')}
                showSettingsBtn={false}
            />
        )

        expect(screen.getByText('Error: boom')).toBeInTheDocument()
    })

    it('leads to the settings when the user can fix the problem there', async () => {
        const user = userEvent.setup()
        renderWithDeps(
            <>
                <ErrorCard Card={MediumCard} error="x" showSettingsBtn />
                <Path />
            </>
        )

        await user.click(screen.getByRole('button', { name: 'Settings' }))

        expect(screen.getByTestId('path')).toHaveTextContent('/settings')
    })
})
