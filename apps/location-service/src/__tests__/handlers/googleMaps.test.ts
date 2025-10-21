import {UnauthorizedError} from '@vexl-next/domain/src/general/commonErrors'
import {
  LatitudeE,
  LongitudeE,
} from '@vexl-next/domain/src/utility/geoCoordinates'
import {LocationNotFoundError} from '@vexl-next/rest-api/src/services/location/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {queryGeocodeMock} from '../utils/mockedGoogleMapLayer'
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
            urlParams: {
              lang: 'EN',
              latitude: Schema.decodeSync(LatitudeE)(20),
              longitude: Schema.decodeSync(LongitudeE)(10),
            },
          }),
          Effect.either
        )

        expectErrorResponse(UnauthorizedError)(response)
      })
    )
  })

  it('Returns proper coordinates', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getGeocodedCoordinates({
            urlParams: {
              lang: 'EN',
              latitude: Schema.decodeSync(LatitudeE)(20),
              longitude: Schema.decodeSync(LongitudeE)(10),
            },
          })
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

        yield* _(setDummyAuthHeaders)
        const response = yield* _(
          client.getGeocodedCoordinates({
            urlParams: {
              lang: 'EN',
              latitude: Schema.decodeSync(LatitudeE)(20),
              longitude: Schema.decodeSync(LongitudeE)(10),
            },
          }),
          Effect.either
        )

        expectErrorResponse(LocationNotFoundError)(response)
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
            urlParams: {
              lang: 'EN',
              phrase: 'something',
            },
          }),
          Effect.either
        )

        expectErrorResponse(UnauthorizedError)(response)
      })
    )
  })

  it('Returns proper suggestions', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)
        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {
              lang: 'EN',
              phrase: 'something',
            },
          })
        )

        expect(response).toBeDefined()
      })
    )
  })
})
