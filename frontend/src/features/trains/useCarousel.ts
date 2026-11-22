import { useCallback, useEffect, useState } from 'react'
import { useServices } from '@/app/services/useServices'

export interface Carousel {
    readonly index: number
    readonly next: () => void
    readonly previous: () => void
}

/**
 * Cycles through `count` items, moving on by itself every `intervalSeconds`.
 * A manual move starts the countdown over, so a choice is not overridden a
 * moment later. The index always stays inside the list, even when it shrinks.
 */
export const useCarousel = (
    count: number,
    intervalSeconds: number
): Carousel => {
    const { scheduler } = useServices()
    const [position, setPosition] = useState(0)
    // Bumped by manual moves, to restart the timer.
    const [round, setRound] = useState(0)

    const index = count <= 0 ? 0 : Math.min(position, count - 1)

    useEffect(() => {
        if (count <= 1) return
        return scheduler.setInterval(
            () =>
                setPosition(
                    (current) => (Math.min(current, count - 1) + 1) % count
                ),
            intervalSeconds * 1000
        )
    }, [scheduler, count, intervalSeconds, round])

    const move = useCallback(
        (step: 1 | -1) => {
            if (count <= 1) return
            setPosition(
                (current) =>
                    (Math.min(current, count - 1) + step + count) % count
            )
            setRound((current) => current + 1)
        },
        [count]
    )

    return {
        index,
        next: useCallback(() => move(1), [move]),
        previous: useCallback(() => move(-1), [move]),
    }
}
