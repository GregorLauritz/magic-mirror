import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { useGetTasks, useGetTaskLists } from '../../apis/tasks'
import * as fetchUtils from '../../common/fetch'
import { ReactNode } from 'react'

describe('tasks API hooks', () => {
    let queryClient: QueryClient

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                    cacheTime: 0,
                },
            },
        })
        vi.clearAllMocks()
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )

    describe('useGetTasks', () => {
        it('should fetch tasks successfully', async () => {
            const mockTasks = {
                count: 2,
                list: [
                    {
                        id: '1',
                        title: 'Test Task 1',
                        status: 'needsAction',
                        due: '2024-01-20T00:00:00Z',
                    },
                    {
                        id: '2',
                        title: 'Test Task 2',
                        status: 'completed',
                        completed: '2024-01-15T10:00:00Z',
                    },
                ],
            }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockTasks)

            const params = new URLSearchParams({
                count: '5',
                showCompleted: 'false',
            })

            const { result } = renderHook(() => useGetTasks(params), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual(mockTasks)
            expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
                expect.stringContaining('/api/tasks?')
            )
            expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
                expect.stringContaining('count=5')
            )
            expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
                expect.stringContaining('showCompleted=false')
            )
        })

        it('should handle different query parameters', async () => {
            const mockTasks = { count: 0, list: [] }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockTasks)

            const params1 = new URLSearchParams({
                count: '10',
                showCompleted: 'false',
            })
            const params2 = new URLSearchParams({
                count: '5',
                showCompleted: 'true',
                tasklist_id: '@default',
            })

            const { result: result1 } = renderHook(
                () => useGetTasks(params1),
                {
                    wrapper,
                }
            )
            const { result: result2 } = renderHook(
                () => useGetTasks(params2),
                {
                    wrapper,
                }
            )

            await waitFor(() => {
                expect(result1.current.isSuccess).toBe(true)
                expect(result2.current.isSuccess).toBe(true)
            })

            expect(fetchUtils.fetchJson).toHaveBeenCalledTimes(2)
        })

        it('should handle fetch errors', async () => {
            const mockError = new Error('Tasks API error')
            vi.spyOn(fetchUtils, 'fetchJson').mockRejectedValue(mockError)

            const params = new URLSearchParams({ count: '5' })

            const { result } = renderHook(() => useGetTasks(params), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
            })

            expect(result.current.error).toEqual(mockError)
        })

        it('should be in loading state initially', () => {
            vi.spyOn(fetchUtils, 'fetchJson').mockImplementation(
                () => new Promise(() => {})
            )

            const params = new URLSearchParams({ count: '5' })

            const { result } = renderHook(() => useGetTasks(params), {
                wrapper,
            })

            expect(result.current.isLoading).toBe(true)
            expect(result.current.data).toBeUndefined()
        })

        it('should fetch tasks with default parameters', async () => {
            const mockTasks = {
                count: 1,
                list: [
                    {
                        id: '1',
                        title: 'Default Task',
                        status: 'needsAction',
                    },
                ],
            }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockTasks)

            const params = new URLSearchParams()

            const { result } = renderHook(() => useGetTasks(params), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual(mockTasks)
            expect(fetchUtils.fetchJson).toHaveBeenCalledWith('/api/tasks?')
        })

        it('should handle empty task list', async () => {
            const mockTasks = { count: 0, list: [] }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockTasks)

            const params = new URLSearchParams({ count: '5' })

            const { result } = renderHook(() => useGetTasks(params), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual(mockTasks)
            expect(result.current.data.count).toBe(0)
            expect(result.current.data.list.length).toBe(0)
        })

        it('should handle tasks with optional fields', async () => {
            const mockTasks = {
                count: 1,
                list: [
                    {
                        id: '1',
                        title: 'Task with notes',
                        status: 'needsAction',
                        notes: 'This is a note',
                        due: '2024-02-01T00:00:00Z',
                    },
                ],
            }

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockTasks)

            const params = new URLSearchParams({ count: '5' })

            const { result } = renderHook(() => useGetTasks(params), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual(mockTasks)
            expect(result.current.data.list[0].notes).toBe('This is a note')
            expect(result.current.data.list[0].due).toBe(
                '2024-02-01T00:00:00Z'
            )
        })
    })

    describe('useGetTaskLists', () => {
        it('should fetch task lists successfully', async () => {
            const mockTaskLists = [
                { id: 'list1', title: 'My Tasks' },
                { id: 'list2', title: 'Work Tasks' },
            ]

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockTaskLists)

            const { result } = renderHook(() => useGetTaskLists(), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual(mockTaskLists)
            expect(fetchUtils.fetchJson).toHaveBeenCalledWith(
                expect.stringContaining('/api/tasks/lists')
            )
        })

        it('should handle fetch errors', async () => {
            const mockError = new Error('Task lists API error')
            vi.spyOn(fetchUtils, 'fetchJson').mockRejectedValue(mockError)

            const { result } = renderHook(() => useGetTaskLists(), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isError).toBe(true)
            })

            expect(result.current.error).toEqual(mockError)
        })

        it('should be in loading state initially', () => {
            vi.spyOn(fetchUtils, 'fetchJson').mockImplementation(
                () => new Promise(() => {})
            )

            const { result } = renderHook(() => useGetTaskLists(), {
                wrapper,
            })

            expect(result.current.isLoading).toBe(true)
            expect(result.current.data).toBeUndefined()
        })

        it('should handle empty task lists', async () => {
            const mockTaskLists: never[] = []

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockTaskLists)

            const { result } = renderHook(() => useGetTaskLists(), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data).toEqual([])
            expect(result.current.data?.length).toBe(0)
        })

        it('should return task lists with correct structure', async () => {
            const mockTaskLists = [
                { id: 'list1', title: 'Personal' },
                { id: 'list2', title: 'Shopping' },
                { id: 'list3', title: 'Work Projects' },
            ]

            vi.spyOn(fetchUtils, 'fetchJson').mockResolvedValue(mockTaskLists)

            const { result } = renderHook(() => useGetTaskLists(), {
                wrapper,
            })

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true)
            })

            expect(result.current.data?.length).toBe(3)
            expect(result.current.data?.[0]).toHaveProperty('id')
            expect(result.current.data?.[0]).toHaveProperty('title')
            expect(typeof result.current.data?.[0].id).toBe('string')
            expect(typeof result.current.data?.[0].title).toBe('string')
        })
    })
})
