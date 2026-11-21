import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { CoordinatesGate } from '@/features/weather/CoordinatesGate'
import { LocationContext } from '../../../common/LocationContext'
import { MediumCard } from '@/shared/ui/CardFrame'
import { renderWithDeps } from '../../support/renderWithDeps'

// The gate currently reads the legacy LocationContext through a transitional
// bridge (removed with that context in step S4).
const renderGate = (value: {
    latitude: number
    longitude: number
    isLoading: boolean
}) =>
    renderWithDeps(
        <LocationContext.Provider value={value}>
            <CoordinatesGate
                Card={MediumCard}
                loading={<div>loading placeholder</div>}
            >
                {(coordinates) => (
                    <div>
                        ready {coordinates.latitude},{coordinates.longitude}
                    </div>
                )}
            </CoordinatesGate>
        </LocationContext.Provider>
    )

describe('CoordinatesGate', () => {
    it('shows the loading placeholder while the location is being resolved', () => {
        renderGate({ latitude: 0, longitude: 0, isLoading: true })

        expect(screen.getByText('loading placeholder')).toBeInTheDocument()
    })

    it('tells the user to set a location when there are no coordinates', () => {
        renderGate({ latitude: 0, longitude: 0, isLoading: false })

        expect(
            screen.getByText(
                'Longitude and or latitude are not set. Please update your location in the settings'
            )
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', { name: 'Settings' })
        ).toBeInTheDocument()
        expect(
            screen.queryByText('loading placeholder')
        ).not.toBeInTheDocument()
    })

    it('renders its children with the coordinates once they are known', () => {
        renderGate({ latitude: 48.7, longitude: 9.1, isLoading: false })

        expect(screen.getByText('ready 48.7,9.1')).toBeInTheDocument()
    })
})
