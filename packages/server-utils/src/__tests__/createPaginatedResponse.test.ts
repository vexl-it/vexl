import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, type ParseResult, Schema} from 'effect'
import createPaginatedResponse from '../../../server-utils/src/createPaginatedResponse'

const MockedDataSchema = Schema.Struct({
  id: Schema.Int,
  name: Schema.String,
})
type MockedDataSchema = typeof MockedDataSchema.Type

const MockedNextPageTokenSchema = Schema.Struct({
  startIndex: Schema.Int,
})
type MockedNextPageTokenSchema = typeof MockedNextPageTokenSchema.Type

function createMockedData({
  numberOfRounds,
}: {
  numberOfRounds: number
}): MockedDataSchema[] {
  const data: MockedDataSchema[] = []
  for (let i = 1; i <= numberOfRounds; i++) {
    data.push({id: i, name: `Item ${i}`})
  }
  return data
}

function mockedDbEffect(
  data: MockedDataSchema[],
  startIndex = 0
): Effect.Effect<
  readonly MockedDataSchema[],
  ParseResult.ParseError | UnexpectedServerError
> {
  return Effect.gen(function* (_) {
    return data.slice(startIndex) as readonly MockedDataSchema[]
  })
}

describe('Create paginated response tests', () => {
  it('Should return proper response of paginated data', async () => {
    const limit = 2
    const mockData: MockedDataSchema[] = createMockedData({numberOfRounds: 5})

    // First page
    const firstPageResponse = await Effect.runPromise(
      createPaginatedResponse({
        limit: 2,
        nextPageToken: undefined,
        nextPageTokenSchema: MockedNextPageTokenSchema,
        defaultNextPageToken: {startIndex: 0},
        dbEffectToRun: ({decodedNextPageToken, limit}) =>
          mockedDbEffect(mockData, decodedNextPageToken.startIndex).pipe(
            Effect.map((data) => data.slice(0, limit))
          ),
        createNextPageToken: (lastItem: MockedDataSchema) => ({
          startIndex: mockData.findIndex((item) => item.id === lastItem.id) + 1,
        }),
      })
    )

    expect(firstPageResponse).toEqual({
      items: mockData.slice(0, limit),
      nextPageToken: expect.any(String),
      hasNext: true,
      limit,
    })

    // Second page
    const secondPageResponse = await Effect.runPromise(
      createPaginatedResponse({
        limit,
        nextPageToken: firstPageResponse.nextPageToken ?? undefined,
        nextPageTokenSchema: MockedNextPageTokenSchema,
        defaultNextPageToken: {startIndex: 0},
        dbEffectToRun: ({decodedNextPageToken, limit}) =>
          mockedDbEffect(mockData, decodedNextPageToken.startIndex).pipe(
            Effect.map((data) => data.slice(0, limit))
          ),
        createNextPageToken: (lastItem: MockedDataSchema) => ({
          startIndex: mockData.findIndex((item) => item.id === lastItem.id) + 1,
        }),
      })
    )

    expect(secondPageResponse).toEqual({
      items: mockData.slice(limit, limit * 2),
      nextPageToken: expect.any(String),
      hasNext: true,
      limit,
    })

    // Last page (should have no more items after)
    const lastPageResponse = await Effect.runPromise(
      createPaginatedResponse({
        limit: 2,
        nextPageToken: secondPageResponse.nextPageToken ?? undefined,
        nextPageTokenSchema: MockedNextPageTokenSchema,
        defaultNextPageToken: {startIndex: 0},
        dbEffectToRun: ({decodedNextPageToken, limit}) =>
          mockedDbEffect(mockData, decodedNextPageToken.startIndex).pipe(
            Effect.map((data) => data.slice(0, limit))
          ),
        createNextPageToken: (lastItem: MockedDataSchema) => ({
          startIndex: mockData.findIndex((item) => item.id === lastItem.id) + 1,
        }),
      })
    )

    expect(lastPageResponse).toEqual({
      items: mockData.slice(limit * 2),
      nextPageToken: expect.any(String),
      hasNext: false,
      limit,
    })
  })

  it('Should handle empty results', async () => {
    const emptyData: MockedDataSchema[] = []

    const response = await Effect.runPromise(
      createPaginatedResponse({
        limit: 10,
        nextPageToken: undefined,
        nextPageTokenSchema: MockedNextPageTokenSchema,
        defaultNextPageToken: {startIndex: 0},
        dbEffectToRun: () => mockedDbEffect(emptyData, 0),
        createNextPageToken: (lastItem: MockedDataSchema) => ({
          startIndex: 1,
        }),
      })
    )

    expect(response).toEqual({
      items: [],
      nextPageToken: null,
      hasNext: false,
      limit: 10,
    })
  })

  it('Should handle zero limit', async () => {
    const mockData = createMockedData({numberOfRounds: 2})

    const response = await Effect.runPromise(
      createPaginatedResponse({
        limit: 0,
        nextPageToken: undefined,
        nextPageTokenSchema: MockedNextPageTokenSchema,
        defaultNextPageToken: {startIndex: 0},
        dbEffectToRun: () => mockedDbEffect(mockData, 0),
        createNextPageToken: (lastItem: MockedDataSchema) => ({
          startIndex: 1,
        }),
      })
    )

    expect(response).toEqual({
      items: [],
      nextPageToken: null,
      hasNext: false,
      limit: 0,
    })
  })
})
