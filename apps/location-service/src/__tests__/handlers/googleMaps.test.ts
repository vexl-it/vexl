import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {LocationNotFoundError} from '@vexl-next/rest-api/src/services/location/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {queryGeocodeMock} from '../utils/mockedGoogleMapLayer'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

describe('geocode', () => {
  it('Returns proper coordinates', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        yield* setDummyAuthHeaders

        const response = yield* client.getGeocodedCoordinates({
          query: {
            lang: 'EN',
            latitude: Schema.decodeSync(Latitude)(20),
            longitude: Schema.decodeSync(Longitude)(10),
          },
        })

        expect(response).toBeDefined()
      })
    )
  })

  it('Returns not found when location not found', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        queryGeocodeMock.mockReturnValueOnce(
          Effect.fail(new LocationNotFoundError({status: 404}))
        )

        yield* setDummyAuthHeaders
        const response = yield* pipe(
          client.getGeocodedCoordinates({
            query: {
              lang: 'EN',
              latitude: Schema.decodeSync(Latitude)(20),
              longitude: Schema.decodeSync(Longitude)(10),
            },
          }),
          Effect.result
        )

        expectErrorResponse(LocationNotFoundError)(response)
      })
    )
  })
})

describe('Suggest', () => {
  it('Returns proper suggestions', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        yield* setDummyAuthHeaders
        const response = yield* client.getLocationSuggestion({
          query: {
            lang: 'EN',
            phrase: 'something',
          },
        })

        expect(response).toBeDefined()
      })
    )
  })
})
