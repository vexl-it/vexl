import {setDummyAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'
import {seedPlacesInDb} from '../utils/seedPlaces'

// The runtime itself is started/disposed globally in jest.afterenv.ts
beforeAll(async () => {
  await runPromiseInMockedEnvironment(seedPlacesInDb)
})

describe('suggest', () => {
  it('finds a city by prefix and localizes both rows', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'de', phrase: 'Bratis'},
          })
        )

        expect(response.result).toHaveLength(1)
        const {userData} = response.result[0]
        expect(userData.placeId).toEqual('osm:1')
        expect(userData.suggestFirstRow).toEqual('Pressburg')
        // A city is self sufficient - only the country is added as context
        expect(userData.suggestSecondRow).toEqual('Slowakei')
        expect(userData.latitude).toBeCloseTo(48.1486)
        expect(userData.longitude).toBeCloseTo(17.1077)
      })
    )
  })

  it('accepts a regional lang tag and falls back to the local name', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'sk-SK', phrase: 'Bratis'},
          })
        )

        expect(response.result).toHaveLength(1)
        // No sk translation is seeded, so the OSM name is used as is
        expect(response.result[0].userData.suggestFirstRow).toEqual(
          'Bratislava'
        )
      })
    )
  })

  it('finds a city by its translated name', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'Prague'},
          })
        )

        expect(response.result).toHaveLength(1)
        expect(response.result[0].userData.placeId).toEqual('osm:2')
        expect(response.result[0].userData.suggestFirstRow).toEqual('Prague')
        expect(response.result[0].userData.suggestSecondRow).toEqual('Czechia')
      })
    )
  })

  it('matches names without diacritics and adds city context to a street', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'obchodna'},
          })
        )

        expect(response.result).toHaveLength(1)
        expect(response.result[0].userData.suggestFirstRow).toEqual('Obchodná')
        expect(response.result[0].userData.suggestSecondRow).toEqual(
          'Bratislava, Slovakia'
        )
      })
    )
  })

  it('keeps distinct same-named towns as separate suggestions', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'springfield'},
          })
        )

        // Both towns render identically ("Springfield" / "United States") but
        // sit far apart, so the dedupe must not collapse them
        expect(
          response.result.map((one) => one.userData.placeId).sort()
        ).toEqual(['osm:7', 'osm:8'])
      })
    )
  })

  it('matches letters without a decomposed ascii form ("lodz" finds "Łódź")', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'lodz'},
          })
        )

        expect(response.result).toHaveLength(1)
        expect(response.result[0].userData.placeId).toEqual('osm:9')
        expect(response.result[0].userData.suggestFirstRow).toEqual('Łódź')
        expect(response.result[0].userData.suggestSecondRow).toEqual('Poland')
      })
    )
  })

  it('falls back to English for a lang that is not a valid locale tag', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: '00', phrase: 'Praha'},
          })
        )

        expect(response.result).toHaveLength(1)
        expect(response.result[0].userData.suggestSecondRow).toEqual('Czechia')
      })
    )
  })

  it('finds a POI and adds city context', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'urban hou'},
          })
        )

        expect(response.result).toHaveLength(1)
        expect(response.result[0].userData.placeId).toEqual('osm:5')
        expect(response.result[0].userData.suggestFirstRow).toEqual(
          'Urban House'
        )
        expect(response.result[0].userData.suggestSecondRow).toEqual(
          'Bratislava, Slovakia'
        )
      })
    )
  })

  it('tolerates a typo in an important place name', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'bratislva'},
          })
        )

        expect(response.result.map((one) => one.userData.placeId)).toContain(
          'osm:1'
        )
      })
    )
  })

  it('searches only important places for very short phrases', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        // "ur" would prefix match the seeded café, but phrases shorter than 3
        // characters never leave the important-places fast path
        const withoutMinorPlaces = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'ur'},
          })
        )
        expect(withoutMinorPlaces.result).toHaveLength(0)

        // A city is important enough to be found by a single character
        const withImportantPlace = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'b'},
          })
        )
        expect(
          withImportantPlace.result.map((one) => one.userData.placeId)
        ).toEqual(['osm:1'])
      })
    )
  })

  it('returns an empty result for a blank phrase', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const response = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: '   '},
          })
        )

        expect(response.result).toHaveLength(0)
      })
    )
  })

  it('zooms wider for a city than for a café', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setDummyAuthHeaders)

        const city = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'Praha'},
          })
        )
        const cafe = yield* _(
          client.getLocationSuggestion({
            urlParams: {lang: 'en', phrase: 'urban hou'},
          })
        )

        const heightOf = (viewport: {
          northeast: {latitude: number}
          southwest: {latitude: number}
        }): number => viewport.northeast.latitude - viewport.southwest.latitude

        expect(heightOf(city.result[0].userData.viewport)).toBeGreaterThan(
          heightOf(cafe.result[0].userData.viewport)
        )
      })
    )
  })
})
