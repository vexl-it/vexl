import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {GeocodingDbService} from '@vexl-next/geocoding-db/src/GeocodingDbService'
import {GeocodingRecordWithContext} from '@vexl-next/geocoding-db/src/GeocodingDbService/domain'
import {
  GetLocationSuggestionsRequest,
  type GetLocationSuggestionsResponse,
} from '@vexl-next/rest-api/src/services/location/contracts'
import {Cause, Effect, Either, Exit, Layer, Schema} from 'effect'
import {GeocodingService} from '../../geocoding'

const querySuggest = (
  geocodingDbLayer: Layer.Layer<GeocodingDbService>
): Effect.Effect<GetLocationSuggestionsResponse, UnexpectedServerError> =>
  Effect.gen(function* (_) {
    const geocoding = yield* _(GeocodingService)
    return yield* _(
      geocoding.querySuggest(
        new GetLocationSuggestionsRequest({
          phrase: 'private search phrase',
          lang: 'en',
        })
      )
    )
  }).pipe(
    Effect.provide(GeocodingService.Live),
    Effect.provide(geocodingDbLayer)
  )

describe('geocoding reporting', () => {
  it('preserves response validation details for inspection', async () => {
    const invalidRecord = Schema.decodeUnknownSync(GeocodingRecordWithContext)({
      id: '1',
      placeType: 'city',
      name: 'Private searched place',
      names: {},
      countryCode: null,
      population: null,
      importance: 1,
      latitude: 200,
      longitude: 0,
      cityName: null,
      cityNames: null,
    })
    const geocodingDbLayer = Layer.succeed(GeocodingDbService, {
      suggestPlaces: () => Effect.succeed([invalidRecord]),
      nearestPlace: () => Effect.die('Unused in this test'),
    })

    const result = await Effect.runPromise(
      querySuggest(geocodingDbLayer).pipe(Effect.either)
    )

    expect(Either.isLeft(result)).toBe(true)
    if (Either.isRight(result)) return

    expect(Schema.is(UnexpectedServerError)(result.left)).toBe(true)
    expect(JSON.stringify(result.left.cause)).toContain('ParseError')
    expect(String(result.left.cause)).toContain('actual 200')
  })

  it('preserves defects for inspection', async () => {
    const geocodingDbLayer = Layer.succeed(GeocodingDbService, {
      suggestPlaces: () =>
        Effect.die(new Error('Defect for private search phrase at 50.1,14.4')),
      nearestPlace: () => Effect.die('Unused in this test'),
    })

    const exit = await Effect.runPromise(
      querySuggest(geocodingDbLayer).pipe(Effect.exit)
    )
    expect(Exit.isFailure(exit)).toBe(true)
    if (Exit.isSuccess(exit)) return

    expect(String(Cause.squash(exit.cause))).toContain(
      'Defect for private search phrase at 50.1,14.4'
    )
  })
})
