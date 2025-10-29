import {Array, Effect, Option, pipe, Schema} from 'effect'
import fetchAllPaginatedData from '../fetchAllPaginatedData'

const MockedDataSchema = Schema.Struct({
  id: Schema.Int,
  name: Schema.String,
})
type MockedDataSchema = typeof MockedDataSchema.Type

function createMockedData({
  numberOfItems,
}: {
  numberOfItems: number
}): MockedDataSchema[] {
  const data: MockedDataSchema[] = []
  for (let i = 1; i <= numberOfItems; i++) {
    data.push({id: i, name: `Item ${i}`})
  }
  return data
}

function createMockedFetchEffect({
  data,
  limit,
}: {
  data: MockedDataSchema[]
  limit: number
}) {
  return (nextPageToken?: string) => {
    return Effect.gen(function* (_) {
      const startIndex = nextPageToken ? parseInt(nextPageToken, 10) : 0
      const endIndex = Math.min(startIndex + limit, data.length)
      const items = data.slice(startIndex, endIndex)
      const hasNext = endIndex < data.length
      const newNextPageToken = endIndex.toString()

      return {
        nextPageToken: newNextPageToken,
        hasNext,
        limit,
        items,
      }
    })
  }
}

describe('Fetch all paginated data tests', () => {
  it('Should fetch all data across multiple pages', async () => {
    const mockData = createMockedData({numberOfItems: 7})
    const limit = 3
    const fetchEffect = createMockedFetchEffect({data: mockData, limit})

    const result = await Effect.runPromise(
      fetchAllPaginatedData({
        fetchEffectToRun: fetchEffect,
      })
    )

    expect(result).toEqual(mockData)
    expect(result).toHaveLength(7)
  })

  it('Should handle single page of data', async () => {
    const mockData = createMockedData({numberOfItems: 2})
    const limit = 5
    const fetchEffect = createMockedFetchEffect({data: mockData, limit})

    const result = await Effect.runPromise(
      fetchAllPaginatedData({
        fetchEffectToRun: fetchEffect,
      })
    )

    expect(result).toEqual(mockData)
    expect(result).toHaveLength(2)
  })

  it('Should handle empty data', async () => {
    const mockData: MockedDataSchema[] = []
    const limit = 10
    const fetchEffect = createMockedFetchEffect({data: mockData, limit})

    const result = await Effect.runPromise(
      fetchAllPaginatedData({
        fetchEffectToRun: fetchEffect,
      })
    )

    expect(result).toEqual([])
    expect(result).toHaveLength(0)
  })

  it('Should store the final next page token when provided', async () => {
    const mockData = createMockedData({numberOfItems: 5})
    const limit = 2
    const fetchEffect = createMockedFetchEffect({data: mockData, limit})
    let storedToken: string | undefined

    const result = await Effect.runPromise(
      fetchAllPaginatedData({
        fetchEffectToRun: fetchEffect,
        storeNextPageToken: (token) => {
          storedToken = token
        },
      })
    )

    expect(result).toEqual(mockData)
    expect(storedToken).not.toBeUndefined()
    const lastToken = pipe(
      Array.last(mockData),
      Option.map((item) => item.id.toString()),
      Option.getOrElse(() => undefined)
    )
    expect(storedToken).toEqual(lastToken)
  })

  it('Should handle large dataset efficiently', async () => {
    const mockData = createMockedData({numberOfItems: 100})
    const limit = 10
    const fetchEffect = createMockedFetchEffect({data: mockData, limit})

    const result = await Effect.runPromise(
      fetchAllPaginatedData({
        fetchEffectToRun: fetchEffect,
      })
    )

    expect(result).toEqual(mockData)
    expect(result).toHaveLength(100)
  })

  it('Should handle exact page boundary', async () => {
    const mockData = createMockedData({numberOfItems: 6})
    const limit = 3 // Exactly 2 pages
    const fetchEffect = createMockedFetchEffect({data: mockData, limit})

    const result = await Effect.runPromise(
      fetchAllPaginatedData({
        fetchEffectToRun: fetchEffect,
      })
    )

    expect(result).toEqual(mockData)
    expect(result).toHaveLength(6)
  })

  it('Should maintain order of items across pages', async () => {
    const mockData = createMockedData({numberOfItems: 8})
    const limit = 3
    const fetchEffect = createMockedFetchEffect({data: mockData, limit})

    const result = await Effect.runPromise(
      fetchAllPaginatedData({
        fetchEffectToRun: fetchEffect,
      })
    )

    // Verify order is maintained
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toEqual({id: i + 1, name: `Item ${i + 1}`})
    }
  })

  it('Should handle fetch effect errors', async () => {
    const errorMessage = 'Network error'
    const fetchEffect = (): Effect.Effect<never, Error> =>
      Effect.fail(new Error(errorMessage))

    const result = Effect.runPromise(
      fetchAllPaginatedData({
        fetchEffectToRun: fetchEffect,
      })
    )

    await expect(result).rejects.toThrow(errorMessage)
  })

  it('Should call storeNextPageToken with final token', async () => {
    const mockData = createMockedData({numberOfItems: 3})
    const pageSize = 2

    // Custom fetch effect that always returns a next page token
    const fetchEffect = (
      nextPageToken?: string
    ): Effect.Effect<
      {
        nextPageToken: string | null
        hasNext: boolean
        limit: number
        items: readonly MockedDataSchema[]
      },
      never
    > => {
      return Effect.gen(function* (_) {
        const startIndex = nextPageToken ? parseInt(nextPageToken, 10) : 0
        const endIndex = Math.min(startIndex + pageSize, mockData.length)
        const pageData = mockData.slice(startIndex, endIndex)
        const hasNext = endIndex < mockData.length

        return {
          nextPageToken: hasNext ? endIndex.toString() : 'final-token',
          hasNext,
          limit: pageSize,
          items: pageData as readonly MockedDataSchema[],
        }
      })
    }

    let storedToken: string | undefined

    const result = await Effect.runPromise(
      fetchAllPaginatedData({
        fetchEffectToRun: fetchEffect,
        storeNextPageToken: (token) => {
          storedToken = token
        },
      })
    )

    expect(result).toEqual(mockData)
    expect(storedToken).toBe('final-token')
  })
})
