import { beforeEach, describe, expect, it } from 'vitest'
import { AuthRequiredError, HttpError } from '@/application/ports/errors'
import { AuthorizedHttpClient } from '@/infrastructure/google/AuthorizedHttpClient'
import { FakeAuthSession } from '../../support/FakeAuthSession'
import { FakeHttpClient } from '../../support/FakeHttpClient'

const URL_UNDER_TEST =
    'https://www.googleapis.com/calendar/v3/users/me/calendarList'

describe('AuthorizedHttpClient', () => {
    let auth: FakeAuthSession
    let inner: FakeHttpClient
    let client: AuthorizedHttpClient

    beforeEach(() => {
        auth = new FakeAuthSession()
        inner = new FakeHttpClient().when('googleapis.com').reply({ items: [] })
        client = new AuthorizedHttpClient(inner, auth)
    })

    it("adds the bearer token and keeps the caller's other headers and options", async () => {
        const controller = new AbortController()

        await client.getJson({
            url: URL_UNDER_TEST,
            headers: { Accept: 'application/json' },
            signal: controller.signal,
            retries: 0,
        })

        expect(inner.requests[0]).toEqual({
            url: URL_UNDER_TEST,
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer fake-token',
            },
            signal: controller.signal,
            retries: 0,
        })
    })

    it('fails with AuthRequiredError("signed-out") without calling the API', async () => {
        auth.tokenResult = { status: 'signed-out' }

        await expect(
            client.getJson({ url: URL_UNDER_TEST })
        ).rejects.toMatchObject({
            name: 'AuthRequiredError',
            reason: 'signed-out',
        })
        expect(inner.requests).toEqual([])
    })

    it('fails with AuthRequiredError("refresh-failed") and says why', async () => {
        auth.tokenResult = { status: 'refresh-failed', reason: 'popup_closed' }

        await expect(
            client.getJson({ url: URL_UNDER_TEST })
        ).rejects.toMatchObject({
            reason: 'refresh-failed',
            detail: 'popup_closed',
        })
    })

    it('marks the token as rejected on a 401, so the next call refreshes it', async () => {
        inner = new FakeHttpClient()
            .when('googleapis.com')
            .reply(new HttpError(401, URL_UNDER_TEST))
        client = new AuthorizedHttpClient(inner, auth)

        await expect(
            client.getJson({ url: URL_UNDER_TEST })
        ).rejects.toMatchObject({
            name: 'AuthRequiredError',
            reason: 'rejected',
        })
        expect(auth.rejections).toBe(1)
    })

    it('lets other API errors through unchanged', async () => {
        const failure = new HttpError(500, URL_UNDER_TEST)
        inner = new FakeHttpClient().when('googleapis.com').reply(failure)
        client = new AuthorizedHttpClient(inner, auth)

        await expect(client.getJson({ url: URL_UNDER_TEST })).rejects.toBe(
            failure
        )
        expect(auth.rejections).toBe(0)
    })

    it('is an AuthRequiredError instance, so callers can tell it from a network failure', async () => {
        auth.tokenResult = { status: 'signed-out' }

        await expect(
            client.getJson({ url: URL_UNDER_TEST })
        ).rejects.toBeInstanceOf(AuthRequiredError)
    })
})
