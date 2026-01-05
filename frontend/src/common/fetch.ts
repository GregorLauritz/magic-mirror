import { DEFAULT_FETCH_CONFIG } from '../constants/api'

export const fetchJson = async <T>(
    url: string,
    options: RequestInit = {},
    allowed_status_codes: number[] = [200],
    retries: number = 1
): Promise<T> => {
    const response = await fetchRetry(url, options, allowed_status_codes, retries)
    return response.json() as Promise<T>
}

export const fetchBlob = async (
    url: string,
    options: RequestInit = {},
    allowed_status_codes: number[] = [200],
    retries: number = 1
): Promise<Blob> => {
    const response = await fetchRetry(url, options, allowed_status_codes, retries)
    const reader = response.body?.getReader()
    const stream = await getReadableStream(reader)
    const streamResponse = new Response(stream)
    return streamResponse.blob()
}

// https://dev.to/ycmjason/javascript-fetch-retry-upon-failure-3p6g
export const fetchRetry = async (
    url: string,
    options: RequestInit = {},
    allowed_status_codes: number[] = [200],
    retries: number = 1
): Promise<Response> => {
    try {
        const response = await fetch(url, { ...options, ...DEFAULT_FETCH_CONFIG })
        return checkHttpStatusCode(response, allowed_status_codes, url)
    } catch (err) {
        if (retries <= 1) throw err
        return fetchRetry(url, options, allowed_status_codes, retries - 1)
    }
}

const checkHttpStatusCode = (
    response: Response,
    allowed_status_codes: number[],
    url?: string
): Response => {
    if (allowed_status_codes.includes(response.status)) {
        return response
    }
    throw Object.assign(
        new Error(
            `Request to ${url ?? 'URL'} failed with status code ${response.status}`
        ),
        { code: response.status }
    )
}

const getReadableStream = async (
    reader?: ReadableStreamDefaultReader<Uint8Array>
): Promise<ReadableStream> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new ReadableStream<any>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        start(controller: ReadableStreamController<any>): Promise<void> | void {
            return streamPump(controller, reader)
        },
    })
}

const streamPump = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    controller: ReadableStreamController<any>,
    reader?: ReadableStreamDefaultReader<Uint8Array>
): Promise<void> | void => {
    return reader?.read().then(({ done, value }) => {
        if (done) {
            controller.close()
            return
        }
        if (value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            controller.enqueue(value as any)
        }
        return streamPump(controller, reader)
    })
}
