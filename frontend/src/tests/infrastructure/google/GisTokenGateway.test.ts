import { beforeEach, describe, expect, it } from 'vitest'
import { AuthFlowError } from '@/application/ports/OAuthTokenGateway'
import { GisTokenGateway } from '@/infrastructure/google/GisTokenGateway'
import { FakeClock } from '../../support/FakeClock'
import { FakeGoogleGlobal } from '../../support/FakeGoogleGlobal'
import { FakeScheduler } from '../../support/FakeScheduler'

const TIMEOUTS = { loadMs: 10_000, interactiveMs: 120_000, silentMs: 15_000 }
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('GisTokenGateway', () => {
    let fake: FakeGoogleGlobal
    let scheduler: FakeScheduler
    let gisLoaded: boolean

    beforeEach(() => {
        fake = new FakeGoogleGlobal()
        scheduler = new FakeScheduler(new FakeClock())
        gisLoaded = true
    })

    const gateway = () =>
        new GisTokenGateway({
            getGoogle: () => (gisLoaded ? fake.google : undefined),
            clientId: 'client-id',
            scope: 'calendar.readonly',
            scheduler,
            timeouts: TIMEOUTS,
        })

    describe('warmUp', () => {
        it('creates the token client ahead of the first click', () => {
            gateway().warmUp()

            expect(fake.initConfigs).toHaveLength(1)
            expect(fake.initConfigs[0]).toMatchObject({
                client_id: 'client-id',
                scope: 'calendar.readonly',
            })
            expect(fake.requests).toEqual([]) // initialising is not requesting
        })

        it('creates the client only once', () => {
            const g = gateway()

            g.warmUp()
            g.warmUp()
            void g.requestToken('')

            expect(fake.initConfigs).toHaveLength(1)
        })

        it('waits for the script to load instead of failing at once', async () => {
            gisLoaded = false
            const g = gateway()

            g.warmUp()
            scheduler.advance(300)
            expect(fake.initConfigs).toHaveLength(0)
            gisLoaded = true
            scheduler.advance(100)

            expect(fake.initConfigs).toHaveLength(1)
        })

        it('gives up quietly when the script never loads', () => {
            gisLoaded = false

            expect(() => {
                gateway().warmUp()
                scheduler.advance(TIMEOUTS.loadMs + 1000)
            }).not.toThrow()
        })
    })

    describe('requestToken', () => {
        it("asks Google synchronously when the client is ready, to keep the click's user activation", () => {
            const g = gateway()
            g.warmUp()

            void g.requestToken('consent')

            // no await in between: a popup opened later can be blocked by the browser
            expect(fake.requests).toEqual([{ prompt: 'consent' }])
        })

        it('resolves with the granted token', async () => {
            const g = gateway()
            g.warmUp()
            const result = g.requestToken('')

            fake.respond({ access_token: 'abc', expires_in: 1800 })

            await expect(result).resolves.toEqual({
                accessToken: 'abc',
                expiresInSeconds: 1800,
            })
        })

        it('assumes an hour when Google omits the lifetime', async () => {
            const g = gateway()
            const result = g.requestToken('')

            fake.respond({ access_token: 'abc' })

            await expect(result).resolves.toEqual({
                accessToken: 'abc',
                expiresInSeconds: 3600,
            })
        })

        it('initialises the client on demand when nobody warmed it up', () => {
            void gateway().requestToken('consent')

            expect(fake.initConfigs).toHaveLength(1)
            expect(fake.requests).toEqual([{ prompt: 'consent' }])
        })

        it('waits for the script when it is not there yet, then asks', async () => {
            gisLoaded = false
            const result = gateway().requestToken('consent')
            scheduler.advance(200)
            gisLoaded = true
            scheduler.advance(100)
            await settle()
            fake.respond({ access_token: 'late', expires_in: 60 })

            await expect(result).resolves.toEqual({
                accessToken: 'late',
                expiresInSeconds: 60,
            })
        })

        it('issues ONE Google request for overlapping calls, and both resolve (B2)', async () => {
            const g = gateway()

            const first = g.requestToken('')
            const second = g.requestToken('')
            fake.respond({ access_token: 'shared', expires_in: 100 })

            expect(first).toBe(second)
            await expect(first).resolves.toMatchObject({
                accessToken: 'shared',
            })
            expect(fake.requests).toHaveLength(1)
        })

        it('issues a new Google request once the previous one finished', async () => {
            const g = gateway()
            const first = g.requestToken('')
            fake.respond({ access_token: 'one' })
            await first

            void g.requestToken('')

            expect(fake.requests).toHaveLength(2)
        })

        it('ignores a stray callback when nothing was asked for', () => {
            gateway().warmUp()

            expect(() => fake.respond({ access_token: 'stray' })).not.toThrow()
        })
    })

    describe('failures (B2: the legacy flow had no error callback, so a closed popup hung forever)', () => {
        it.each([
            ['popup_closed', 'popup_closed'],
            ['popup_failed_to_open', 'popup_blocked'],
            ['unknown', 'unknown'],
        ] as const)(
            'maps the popup error "%s" to "%s"',
            async (type, reason) => {
                const result = gateway().requestToken('consent')

                fake.popupError(type)

                await expect(result).rejects.toEqual(new AuthFlowError(reason))
            }
        )

        it('maps "access_denied" in the response to its own reason', async () => {
            const result = gateway().requestToken('consent')

            fake.respond({ error: 'access_denied' })

            await expect(result).rejects.toEqual(
                new AuthFlowError('access_denied')
            )
        })

        it.each([{ error: 'something_else' }, {}])(
            'treats the unusable response %j as unknown',
            async (response) => {
                const result = gateway().requestToken('')

                fake.respond(response)

                await expect(result).rejects.toEqual(
                    new AuthFlowError('unknown')
                )
            }
        )

        it('times out an interactive request after two minutes', async () => {
            const result = gateway().requestToken('consent')
            const settled = result.catch((error: unknown) => error)

            scheduler.advance(TIMEOUTS.interactiveMs)

            expect(await settled).toEqual(new AuthFlowError('timeout'))
        })

        it('times out a silent refresh much sooner', async () => {
            const result = gateway().requestToken('')
            const settled = result.catch((error: unknown) => error)

            scheduler.advance(TIMEOUTS.silentMs)

            expect(await settled).toEqual(new AuthFlowError('timeout'))
        })

        it('lets a new request through after a timeout', async () => {
            const g = gateway()
            const first = g.requestToken('')
            const settled = first.catch(() => undefined)
            scheduler.advance(TIMEOUTS.silentMs)
            await settled

            void g.requestToken('')

            expect(fake.requests).toHaveLength(2)
        })

        it('cancels the timeout once Google answered', async () => {
            const g = gateway()
            const result = g.requestToken('')

            fake.respond({ access_token: 'x' })
            await result

            expect(scheduler.pending()).toBe(0)
        })

        it('reports "script_unavailable" when Google Identity Services never loads', async () => {
            gisLoaded = false
            const result = gateway().requestToken('consent')
            const settled = result.catch((error: unknown) => error)

            scheduler.advance(TIMEOUTS.loadMs + 1000)

            expect(await settled).toEqual(
                new AuthFlowError('script_unavailable')
            )
        })

        it('does not cache a failed load: the next request tries again and can succeed', async () => {
            gisLoaded = false
            const g = gateway()
            const first = g
                .requestToken('consent')
                .catch((error: unknown) => error)
            scheduler.advance(TIMEOUTS.loadMs + 1000)
            expect(await first).toEqual(new AuthFlowError('script_unavailable'))

            gisLoaded = true // e.g. the network came back
            const second = g.requestToken('consent')
            fake.respond({ access_token: 'recovered' })

            await expect(second).resolves.toMatchObject({
                accessToken: 'recovered',
            })
        })
    })

    describe('revoke', () => {
        it('revokes the token at Google', async () => {
            await gateway().revoke('abc')

            expect(fake.revoked).toEqual(['abc'])
        })

        it('does not wait forever for Google to answer', async () => {
            fake.answersRevoke = false
            const done = gateway().revoke('abc')

            scheduler.advance(TIMEOUTS.silentMs)

            await expect(done).resolves.toBeUndefined()
        })

        it('never rejects: revoking is best effort', async () => {
            fake.throwOnRevoke = true

            await expect(gateway().revoke('abc')).resolves.toBeUndefined()
        })

        it('is a no-op when Google Identity Services is not available', async () => {
            gisLoaded = false

            await expect(gateway().revoke('abc')).resolves.toBeUndefined()
        })
    })
})
