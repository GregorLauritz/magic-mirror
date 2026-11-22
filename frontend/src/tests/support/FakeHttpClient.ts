import type { HttpClient, HttpRequest } from '@/application/ports/HttpClient'

type Matcher = string | RegExp | ((request: HttpRequest) => boolean)
type Reply = unknown | Error | ((request: HttpRequest) => unknown)

interface Route {
    readonly matches: (request: HttpRequest) => boolean
    readonly reply: Reply
}

const toPredicate = (matcher: Matcher): ((request: HttpRequest) => boolean) => {
    if (typeof matcher === 'string') {
        return (request) => request.url.includes(matcher)
    }
    if (matcher instanceof RegExp) {
        return (request) => matcher.test(request.url)
    }
    return matcher
}

/**
 * Scripted HttpClient: `when(matcher).reply(...)`. Records every request and
 * fails loudly on anything that was not scripted, so a test never silently
 * depends on the network.
 */
export class FakeHttpClient implements HttpClient {
    readonly requests: HttpRequest[] = []
    private readonly routes: Route[] = []

    when(matcher: Matcher): { reply: (reply: Reply) => FakeHttpClient } {
        return {
            reply: (reply) => {
                this.routes.push({ matches: toPredicate(matcher), reply })
                return this
            },
        }
    }

    async getJson<T = unknown>(request: HttpRequest): Promise<T> {
        this.requests.push(request)
        const route = this.routes.find((candidate) =>
            candidate.matches(request)
        )
        if (route === undefined) {
            throw new Error(`Unscripted request: ${request.url}`)
        }
        const result =
            typeof route.reply === 'function'
                ? (route.reply as (request: HttpRequest) => unknown)(request)
                : route.reply
        // DOMException (e.g. AbortError) is not an Error subclass in every environment
        if (result instanceof Error || result instanceof DOMException)
            throw result
        return result as T
    }
}
