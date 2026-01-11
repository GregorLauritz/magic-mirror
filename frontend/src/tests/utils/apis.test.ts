import { describe, it, expect } from 'vitest'
import { buildQuery } from '../../common/apis'
import { QueryParameters } from '../../models/apis'

describe('apis', () => {
    describe('buildQuery', () => {
        it('should return empty string when no parameters provided', async () => {
            const result = await buildQuery()
            expect(result).toBe('')
        })

        it('should return empty string for empty array', async () => {
            const result = await buildQuery([])
            expect(result).toBe('')
        })

        it('should build query string with single parameter', async () => {
            const params: QueryParameters = [{ name: 'city', value: 'Berlin' }]
            const result = await buildQuery(params)
            expect(result).toBe('?city=Berlin')
        })

        it('should build query string with multiple parameters', async () => {
            const params: QueryParameters = [
                { name: 'city', value: 'Berlin' },
                { name: 'country', value: 'Germany' },
                { name: 'zip_code', value: '10115' },
            ]
            const result = await buildQuery(params)
            expect(result).toBe('?city=Berlin&country=Germany&zip_code=10115')
        })

        it('should handle numeric values', async () => {
            const params: QueryParameters = [
                { name: 'latitude', value: 52.52 },
                { name: 'longitude', value: 13.405 },
            ]
            const result = await buildQuery(params)
            expect(result).toBe('?latitude=52.52&longitude=13.405')
        })

        it('should handle boolean values', async () => {
            const params: QueryParameters = [
                { name: 'enabled', value: true },
                { name: 'disabled', value: false },
            ]
            const result = await buildQuery(params)
            expect(result).toBe('?enabled=true&disabled=false')
        })

        it('should filter out parameters without values', async () => {
            const params: QueryParameters = [
                { name: 'city', value: 'Berlin' },
                { name: 'country' },
                { name: 'zip_code', value: '10115' },
            ]
            const result = await buildQuery(params)
            expect(result).toBe('?city=Berlin&zip_code=10115')
        })

        it('should filter out parameters with undefined values', async () => {
            const params: QueryParameters = [
                { name: 'city', value: 'Berlin' },
                { name: 'country', value: undefined },
            ]
            const result = await buildQuery(params)
            expect(result).toBe('?city=Berlin')
        })

        it('should return empty string when all parameters have no values', async () => {
            const params: QueryParameters = [
                { name: 'city' },
                { name: 'country' },
            ]
            const result = await buildQuery(params)
            expect(result).toBe('')
        })

        it('should handle special characters in values', async () => {
            const params: QueryParameters = [
                { name: 'city', value: 'New York' },
            ]
            const result = await buildQuery(params)
            expect(result).toBe('?city=New York')
        })

        it('should handle empty string values', async () => {
            const params: QueryParameters = [
                { name: 'city', value: '' },
                { name: 'country', value: 'Germany' },
            ]
            const result = await buildQuery(params)
            expect(result).toBe('?country=Germany')
        })

        it('should handle zero as a valid value', async () => {
            const params: QueryParameters = [
                { name: 'count', value: 0 },
                { name: 'offset', value: 10 },
            ]
            const result = await buildQuery(params)
            expect(result).toBe('?count=0&offset=10')
        })
    })
})
