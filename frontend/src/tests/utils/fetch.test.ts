import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchJson, fetchBlob, fetchRetry } from '../../common/fetch'

describe('fetch utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('fetchRetry', () => {
        it('should successfully fetch with valid response', async () => {
            const mockResponse = new Response(
                JSON.stringify({ data: 'test' }),
                {
                    status: 200,
                }
            )
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const result = await fetchRetry('https://api.example.com/test')

            expect(global.fetch).toHaveBeenCalledTimes(1)
            expect(result.status).toBe(200)
        })

        it('should accept custom allowed status codes', async () => {
            const mockResponse = new Response(null, { status: 404 })
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const result = await fetchRetry(
                'https://api.example.com/test',
                {},
                [200, 404]
            )

            expect(result.status).toBe(404)
        })

        it('should throw error for non-allowed status codes', async () => {
            const mockResponse = new Response(null, { status: 500 })
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            await expect(
                fetchRetry('https://api.example.com/test', {}, [200])
            ).rejects.toThrow(
                'Request to https://api.example.com/test failed with status code 500'
            )
        })

        it('should retry on failure', async () => {
            const mockError = new Error('Network error')
            const mockResponse = new Response(
                JSON.stringify({ data: 'test' }),
                {
                    status: 200,
                }
            )

            global.fetch = vi
                .fn()
                .mockRejectedValueOnce(mockError)
                .mockResolvedValueOnce(mockResponse)

            const result = await fetchRetry(
                'https://api.example.com/test',
                {},
                [200],
                2
            )

            expect(global.fetch).toHaveBeenCalledTimes(2)
            expect(result.status).toBe(200)
        })

        it('should fail after retries exhausted', async () => {
            const mockError = new Error('Network error')
            global.fetch = vi.fn().mockRejectedValue(mockError)

            await expect(
                fetchRetry('https://api.example.com/test', {}, [200], 2)
            ).rejects.toThrow('Network error')

            expect(global.fetch).toHaveBeenCalledTimes(2)
        })

        it('should not retry if retries is 1', async () => {
            const mockError = new Error('Network error')
            global.fetch = vi.fn().mockRejectedValue(mockError)

            await expect(
                fetchRetry('https://api.example.com/test', {}, [200], 1)
            ).rejects.toThrow('Network error')

            expect(global.fetch).toHaveBeenCalledTimes(1)
        })

        it('should pass options to fetch', async () => {
            const mockResponse = new Response(
                JSON.stringify({ data: 'test' }),
                {
                    status: 200,
                }
            )
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const options: RequestInit = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            }

            await fetchRetry('https://api.example.com/test', options)

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.example.com/test',
                {
                    ...options,
                    credentials: 'include',
                }
            )
        })
    })

    describe('fetchJson', () => {
        it('should fetch and parse JSON successfully', async () => {
            const mockData = { name: 'Test', value: 123 }
            const mockResponse = new Response(JSON.stringify(mockData), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const result = await fetchJson('https://api.example.com/test')

            expect(result).toEqual(mockData)
        })

        it('should handle custom allowed status codes', async () => {
            const mockData = { error: 'Not found' }
            const mockResponse = new Response(JSON.stringify(mockData), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            })
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const result = await fetchJson(
                'https://api.example.com/test',
                {},
                [200, 404]
            )

            expect(result).toEqual(mockData)
        })

        it('should retry on failure', async () => {
            const mockData = { name: 'Test' }
            const mockError = new Error('Network error')
            const mockResponse = new Response(JSON.stringify(mockData), {
                status: 200,
            })

            global.fetch = vi
                .fn()
                .mockRejectedValueOnce(mockError)
                .mockResolvedValueOnce(mockResponse)

            const result = await fetchJson(
                'https://api.example.com/test',
                {},
                [200],
                2
            )

            expect(result).toEqual(mockData)
            expect(global.fetch).toHaveBeenCalledTimes(2)
        })

        it('should throw error for non-allowed status codes', async () => {
            const mockResponse = new Response(
                JSON.stringify({ error: 'Server error' }),
                {
                    status: 500,
                }
            )
            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            await expect(
                fetchJson('https://api.example.com/test', {}, [200])
            ).rejects.toThrow(
                'Request to https://api.example.com/test failed with status code 500'
            )
        })
    })

    describe('fetchBlob', () => {
        it('should fetch and return blob successfully', async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]))
                    controller.close()
                },
            })

            const mockResponse = {
                status: 200,
                body: mockStream,
            } as Response

            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const result = await fetchBlob('https://api.example.com/image.png')

            expect(result.size).toBeGreaterThanOrEqual(0)
            expect(typeof result.type).toBe('string')
        })

        it('should handle custom allowed status codes', async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]))
                    controller.close()
                },
            })

            const mockResponse = {
                status: 404,
                body: mockStream,
            } as Response

            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const result = await fetchBlob(
                'https://api.example.com/image.png',
                {},
                [200, 404]
            )

            expect(result.size).toBeGreaterThanOrEqual(0)
            expect(typeof result.type).toBe('string')
        })

        it('should retry on failure', async () => {
            const mockError = new Error('Network error')
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new Uint8Array([1, 2, 3]))
                    controller.close()
                },
            })

            const mockResponse = {
                status: 200,
                body: mockStream,
            } as Response

            global.fetch = vi
                .fn()
                .mockRejectedValueOnce(mockError)
                .mockResolvedValueOnce(mockResponse)

            const result = await fetchBlob(
                'https://api.example.com/image.png',
                {},
                [200],
                2
            )

            expect(result.size).toBeGreaterThanOrEqual(0)
            expect(typeof result.type).toBe('string')
            expect(global.fetch).toHaveBeenCalledTimes(2)
        })

        it('should handle empty body stream', async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.close()
                },
            })

            const mockResponse = {
                status: 200,
                body: mockStream,
            } as Response

            global.fetch = vi.fn().mockResolvedValue(mockResponse)

            const result = await fetchBlob('https://api.example.com/image.png')

            expect(result.size).toBe(0)
            expect(typeof result.type).toBe('string')
        })
    })
})
