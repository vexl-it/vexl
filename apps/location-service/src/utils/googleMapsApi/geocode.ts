import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  GetGeocodedCoordinatesResponse,
  LocationNotFoundError,
  type GetGeocodedCoordinatesRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import axios from 'axios'
import {Array, Effect, Option, Redacted, Schema, String, pipe} from 'effect'
import {GoogleCoordinates, GoogleResponseEnvelope} from './common'
import {unexpectedGoogleMapsError} from './errors'

const GoogleGeocodeResult = Schema.Struct({
  place_id: Schema.String,
  formatted_address: Schema.String,
  address_components: Schema.Array(
    Schema.Struct({
      short_name: Schema.String,
      types: Schema.Array(Schema.String),
    })
  ),
  geometry: Schema.Struct({
    location: GoogleCoordinates,
    viewport: Schema.Struct({
      northeast: GoogleCoordinates,
      southwest: GoogleCoordinates,
    }),
  }),
})
type GoogleGeocodeResult = typeof GoogleGeocodeResult.Type

const GoogleGeocodeResponse = Schema.Struct({
  status: Schema.Literal('OK'),
  plus_code: Schema.optional(
    Schema.Struct({
      compound_code: Schema.optional(Schema.String),
    })
  ),
  results: Schema.Array(GoogleGeocodeResult),
})
type GoogleGeocodeResponse = typeof GoogleGeocodeResponse.Type

// const regionRegex = /(?: region| kraj)/gi

// Just keep this just in case. Might be useful
const findTypeInAddressComponents = (
  type: string,
  components: ReadonlyArray<{
    short_name: string
    types: readonly string[]
  }>
): string | undefined =>
  pipe(
    Array.findFirst(components, (oneComponent) =>
      oneComponent.types.includes(type)
    ),
    Option.map((one) => one.short_name),
    Option.getOrElse(() => undefined)
  )

const compoundCodeContainsCity = (
  compoundCode: string,
  city: string | undefined
): boolean => (city ? String.includes(city)(compoundCode) : false)

function findNextLevelArea(result: GoogleGeocodeResult): string | undefined {
  const neightbourhood = result.address_components.find((component) =>
    component.types.includes('neighborhood')
  )
  const area = result.address_components.find(
    (component) =>
      component.types.includes('political') &&
      component.types.includes('sublocality') &&
      component.types.includes('sublocality_level_1')
  )
  const firstAddress = result.address_components.at(0)

  return (
    neightbourhood?.short_name ?? area?.short_name ?? firstAddress?.short_name
  )
}

const getAddress = ({
  responseData,
  firstHit,
}: {
  responseData: GoogleGeocodeResponse
  firstHit: GoogleGeocodeResult
}): Effect.Effect<string> =>
  Effect.gen(function* (_) {
    const country = findTypeInAddressComponents(
      'country',
      firstHit.address_components
    )

    // 3FF2+M4H Praha, Česko
    const compoundCode = responseData.plus_code?.compound_code

    // Praha, Česko
    const cityAndState = compoundCode?.split(' ')?.slice(1)?.join(' ')
    // Praha - CZ
    const cityAndStateShorten = cityAndState?.replace(
      /,([^,]*)$/,
      ` - ${country}`
    )
    const cityOrPartOfTheCity = findNextLevelArea(firstHit)
    const finalAddress = compoundCode
      ? compoundCodeContainsCity(compoundCode, cityOrPartOfTheCity)
        ? // Karlovy Vary - CZ
          cityAndStateShorten
        : // Vinohrady, Praha - CZ
          `${cityOrPartOfTheCity}, ${cityAndStateShorten}`
      : undefined

    // const lvl1 = (() => {
    //   const lvl1 = findTypeInAddressComponents(
    //     'administrative_area_level_1',
    //     firstHit.address_components
    //   )
    //   if (!lvl1) return ''
    //   if (country === 'CZ' || country === 'SK') {
    //     return lvl1.replace(regionRegex, '')
    //   }
    //   return lvl1
    // })()

    return country && cityOrPartOfTheCity && finalAddress
      ? finalAddress
      : firstHit.formatted_address.replace(/^[\d\s]*/, '')
  }).pipe(
    Effect.catchAllDefect((defect) =>
      Effect.zipRight(
        Effect.logError(
          'Error while getting address. Falling back to formatted address',
          defect
        ),
        Effect.succeed(firstHit.formatted_address.replace(/^[\d\s]*/, ''))
      )
    )
  )

export const googleGeocode =
  (apiKey: Redacted.Redacted<string>) =>
  ({
    latitude,
    longitude,
    lang,
  }: GetGeocodedCoordinatesRequest): Effect.Effect<
    GetGeocodedCoordinatesResponse,
    UnexpectedServerError | LocationNotFoundError
  > => {
    return Effect.gen(function* (_) {
      const response = yield* _(
        Effect.tryPromise({
          try: async () =>
            await axios.get<unknown>(
              'https://maps.googleapis.com/maps/api/geocode/json',
              {
                params: {
                  key: Redacted.value(apiKey),
                  language: lang,
                  result_type: 'locality|political|street_address',
                  latlng: `${latitude},${longitude}`,
                },
              }
            ),
          catch: (error) =>
            unexpectedGoogleMapsError({
              operation: 'geocode',
              category: 'RequestFailed',
              error,
              request: {latitude, longitude, lang},
            }),
        })
      )

      const responseEnvelope = yield* _(
        Schema.decodeUnknown(GoogleResponseEnvelope)(response.data)
      )
      if (responseEnvelope.status === 'ZERO_RESULTS') {
        return yield* _(new LocationNotFoundError({status: 404}))
      }
      if (responseEnvelope.status !== 'OK') {
        return yield* _(
          unexpectedGoogleMapsError({
            operation: 'geocode',
            category: 'ResponseRejected',
            request: {latitude, longitude, lang},
            response: response.data,
            responseStatus: responseEnvelope.status,
          })
        )
      }

      const responseData = yield* _(
        Schema.decodeUnknown(GoogleGeocodeResponse)(response.data)
      )
      const firstHit = responseData.results.at(0)
      if (!firstHit) return yield* _(new LocationNotFoundError({status: 404}))

      const address = yield* _(getAddress({responseData, firstHit}))

      return yield* _(
        Schema.decode(GetGeocodedCoordinatesResponse)({
          placeId: firstHit.place_id,
          // Remove postal code from the start as per #865
          address,
          latitude: firstHit.geometry.location.lat,
          longitude: firstHit.geometry.location.lng,
          viewport: {
            northeast: {
              latitude: firstHit.geometry.viewport.northeast.lat,
              longitude: firstHit.geometry.viewport.northeast.lng,
            },
            southwest: {
              latitude: firstHit.geometry.viewport.southwest.lat,
              longitude: firstHit.geometry.viewport.southwest.lng,
            },
          },
        })
      )
    }).pipe(
      Effect.catchTag(
        'ParseError',
        (error) =>
          new UnexpectedServerError({
            status: 500,
            message: 'Google Maps geocode response failed validation',
            cause: error,
          })
      )
    )
  }
