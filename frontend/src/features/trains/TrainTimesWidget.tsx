import { memo } from 'react'
import type { SavedRoute } from '@/domain/settings/UserSettings'
import { useSetting } from '@/features/settings'
import { MediumCard } from '@/shared/ui/CardFrame'
import ErrorCard from '@/shared/ui/ErrorCard'
import { TrainCard } from './TrainCard'
import { useCarousel } from './useCarousel'

const TrainCarousel = ({
    routes,
    intervalSeconds,
}: {
    routes: readonly SavedRoute[]
    intervalSeconds: number
}) => {
    const { index, next, previous } = useCarousel(
        routes.length,
        intervalSeconds
    )
    return (
        <TrainCard
            route={routes[index]}
            controls={
                routes.length > 1
                    ? {
                          index,
                          count: routes.length,
                          onPrevious: previous,
                          onNext: next,
                      }
                    : undefined
            }
        />
    )
}

const TrainTimesComponent = () => {
    const routes = useSetting((settings) => settings.trainRoutes)
    const display = useSetting((settings) => settings.trainDisplay)

    if (routes.length === 0) {
        return (
            <ErrorCard
                Card={MediumCard}
                error="No train connections configured. Please add them in the settings"
                showSettingsBtn
            />
        )
    }

    if (display.mode === 'carousel') {
        return (
            <TrainCarousel
                routes={routes}
                intervalSeconds={display.carouselIntervalSeconds}
            />
        )
    }

    return (
        <>
            {routes.map((route) => (
                <TrainCard key={route.id} route={route} />
            ))}
        </>
    )
}

export const TrainTimesWidget = memo(TrainTimesComponent)
TrainTimesWidget.displayName = 'TrainTimesWidget'
