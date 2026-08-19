import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {seedPlacesInDb} from '@vexl-next/geocoding-db/src/tests/seedPlaces'
import {LocationNotFoundError} from '@vexl-next/rest-api/src/services/location/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const coordinates = (
  latitude: number,
  longitude: number
): {latitude: Latitude; longitude: Longitude} => ({
  latitude: Schema.decodeSync(Latitude)(latitude),
  longitude: Schema.decodeSync(Longitude)(longitude),
})

// The runtime itself is started/disposed globally in jest.afterenv.ts
beforeAll(async () => {
  await runPromiseInMockedEnvironment(seedPlacesInDb)
})

describe('geocode', () => {
  it('resolves a pin to the nearest settlement with city context', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getGeocodedCoordinatesV2({
            urlParams: {lang: 'en', ...coordinates(50.076, 14.438)},
          })
        )

        expect(response.address).toEqual('Vinohrady, Prague - CZ')
        expect(response.placeId).toContain('osm:3')
      })
    )
  })

  it('returns the picked position verbatim, not the settlement center', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getGeocodedCoordinatesV2({
            urlParams: {lang: 'en', ...coordinates(50.076, 14.438)},
          })
        )

        expect(response.latitude).toBeCloseTo(50.076)
        expect(response.longitude).toBeCloseTo(14.438)
        expect(response.viewport.southwest.latitude).toBeLessThan(50.076)
        expect(response.viewport.northeast.latitude).toBeGreaterThan(50.076)
      })
    )
  })

  it('keeps two pins in the same settlement distinct', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const first = yield* _(
          client.getGeocodedCoordinatesV2({
            urlParams: {lang: 'en', ...coordinates(50.0755, 14.4378)},
          })
        )
        const second = yield* _(
          client.getGeocodedCoordinatesV2({
            urlParams: {lang: 'en', ...coordinates(50.0765, 14.4392)},
          })
        )

        expect(first.address).toEqual(second.address)
        expect(first.placeId).not.toEqual(second.placeId)
      })
    )
  })

  it('resolves to a settlement, never to a street or a POI', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        // Pin dropped right on top of the seeded café and street
        const response = yield* _(
          client.getGeocodedCoordinatesV2({
            urlParams: {lang: 'en', ...coordinates(48.1443, 17.1108)},
          })
        )

        expect(response.address).toEqual('Bratislava - SK')
      })
    )
  })

  it('localizes the address', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getGeocodedCoordinatesV2({
            urlParams: {lang: 'de', ...coordinates(50.0875, 14.4213)},
          })
        )

        expect(response.address).toEqual('Prag - CZ')
      })
    )
  })

  it('returns not found for a pin far away from any settlement', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getGeocodedCoordinatesV2({
            urlParams: {lang: 'en', ...coordinates(0, -30)},
          }),
          Effect.either
        )

        expectErrorResponse(LocationNotFoundError)(response)
      })
    )
  })
})
