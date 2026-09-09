import {LocationPlaceId} from '@vexl-next/domain/src/general/offers'
import {seedPlacesInDb} from '@vexl-next/geocoding-db/src/tests/seedPlaces'
import {LocationNotFoundError} from '@vexl-next/rest-api/src/services/location/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const placeId = Schema.decodeSync(LocationPlaceId)

// The runtime itself is started/disposed globally in jest.afterenv.ts
beforeAll(async () => {
  await runPromiseInMockedEnvironment(seedPlacesInDb)
})

describe('localized addresses', () => {
  it('renders a suggestion id like the suggest rows', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocalizedAddresses({urlParams: {placeId: placeId('osm:1')}})
        )

        expect(response.localizedAddresses).toMatchObject({
          de: 'Pressburg, Slowakei',
          en: 'Bratislava, Slovakia',
        })
      })
    )
  })

  it('renders a geocoded pin id like the geocode address', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocalizedAddresses({
            urlParams: {placeId: placeId('osm:3@50.0760,14.4380')},
          })
        )

        expect(response.localizedAddresses).toMatchObject({
          en: 'Vinohrady, Prague - CZ',
          de: 'Vinohrady, Prag - CZ',
        })
      })
    )
  })

  it('returns 404 for unknown and legacy place ids', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        for (const id of ['osm:999', 'ChIJi3lwCZyTC0cRkEAWZg-vAAQ']) {
          const response = yield* _(
            client.getLocalizedAddresses({urlParams: {placeId: placeId(id)}}),
            Effect.either
          )
          expectErrorResponse(LocationNotFoundError)(response)
        }
      })
    )
  })
})
