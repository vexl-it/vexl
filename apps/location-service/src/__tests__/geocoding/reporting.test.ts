import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {GeocodingDbService} from '@vexl-next/geocoding-db/src/GeocodingDbService'
import {GeocodingRecordWithContext} from '@vexl-next/geocoding-db/src/GeocodingDbService/domain'
import {
  GetLocationSuggestionsRequest,
  type GetLocationSuggestionsResponse,
} from '@vexl-next/rest-api/src/services/location/contracts'
import {Cause, Effect, Exit, Layer, Result, Schema} from 'effect'
import {GeocodingService} from '../../geocoding'

const querySuggest = (
  geocodingDbLayer: Layer.Layer<GeocodingDbService>
): Effect.Effect<GetLocationSuggestionsResponse, UnexpectedServerError> =>
  Effect.gen(function* () {
    const geocoding = yield* GeocodingService
    return yield* geocoding.querySuggest(
      new GetLocationSuggestionsRequest({
        phrase: 'private search phrase',
        lang: 'en',
      })
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
      querySuggest(geocodingDbLayer).pipe(Effect.result)
    )

    expect(Result.isFailure(result)).toBe(true)
    if (Result.isSuccess(result)) return

    expect(Schema.is(UnexpectedServerError)(result.failure)).toBe(true)
    expect(JSON.stringify(result.failure.cause)).toContain('SchemaError')
    expect(String(result.failure.cause)).toContain('less than or equal to 90')
    expect(String(result.failure.cause)).toContain('latitude')
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
