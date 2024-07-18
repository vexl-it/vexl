import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {
  LatitudeE,
  LongitudeE,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {LocationNotFoundError} from '@vexl-next/rest-api/src/services/location/contracts'
import {createDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {Effect, Either} from 'effect'
import {queryGeocodeMock} from '../utils/mockedGoogleMapLayer'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from '../utils/runPromiseInMockedEnvironment'

beforeAll(startRuntime)
afterAll(disposeRuntime)

describe('geocode', () => {
  it('Fails without auth headers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const response = yield* _(
          client.getGeocodedCoordinates({
            query: {
              lang: 'EN',
              latitude: Schema.decodeSync(LatitudeE)(20),
              longitude: Schema.decodeSync(LongitudeE)(10),
            },
          }),
          Effect.either
        )

        expect(Either.isLeft(response)).toBe(true)
        if (Either.isLeft(response)) {
          expect(response.left._tag).toEqual('ClientError')
        }
      })
    )
  })

  it('Returns proper coordinates', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const response = yield* _(
          client.getGeocodedCoordinates(
            {
              query: {
                lang: 'EN',
                latitude: Schema.decodeSync(LatitudeE)(20),
                longitude: Schema.decodeSync(LongitudeE)(10),
              },
            },
            HttpClientRequest.setHeaders(yield* _(createDummyAuthHeaders))
          )
        )

        expect(response).toBeDefined()
      })
    )
  })

  it('Returns not found when location not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        queryGeocodeMock.mockReturnValueOnce(
          Effect.fail(new LocationNotFoundError({status: 404}))
        )

        const response = yield* _(
          client.getGeocodedCoordinates(
            {
              query: {
                lang: 'EN',
                latitude: Schema.decodeSync(LatitudeE)(20),
                longitude: Schema.decodeSync(LongitudeE)(10),
              },
            },
            HttpClientRequest.setHeaders(yield* _(createDummyAuthHeaders))
          ),
          Effect.either
        )

        expect(Either.isLeft(response)).toBe(true)
        if (Either.isLeft(response)) {
          expect((response.left.error as any)._tag).toEqual(
            'LocationNotFoundError'
          )
        }
      })
    )
  })
})

describe('Suggest', () => {
  it('Fails without auth headers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const response = yield* _(
          client.getLocationSuggestion({
            query: {
              lang: 'EN',
              phrase: 'something',
            },
          }),
          Effect.either
        )

        expect(Either.isLeft(response)).toBe(true)
        if (Either.isLeft(response)) {
          expect(response.left._tag).toEqual('ClientError')
        }
      })
    )
  })

  it('Returns proper suggestions', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const response = yield* _(
          client.getLocationSuggestion(
            {
              query: {
                lang: 'EN',
                phrase: 'something',
              },
            },
            HttpClientRequest.setHeaders(yield* _(createDummyAuthHeaders))
          )
        )

        expect(response).toBeDefined()
      })
    )
  })
})
