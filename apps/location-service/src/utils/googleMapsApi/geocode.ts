import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  GetGeocodedCoordinatesResponse,
  LocationNotFoundError,
  type GetGeocodedCoordinatesRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import axios from 'axios'
import {Array, Effect, Option, Schema, String, pipe} from 'effect'

interface GoogleGeocodeResult {
  place_id: string
  formatted_address: string
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  geometry: {
    location: {
      lat: number
      lng: number
    }
    viewport: {
      northeast: {
        lat: number
        lng: number
      }
      southwest: {
        lat: number
        lng: number
      }
    }
  }
}

interface GoogleGeocodeResponse {
  plus_code: {
    compound_code: string
    global_code: string
  }
  results: GoogleGeocodeResult[]
}

// const regionRegex = /(?: region| kraj)/gi

// Just keep this just in case. Might be useful
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const findTypeInAddressComponents = (
  type: string,
  components: Array<{
    long_name: string
    short_name: string
    types: string[]
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

export const googleGeocode =
  (apiKey: string) =>
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
        Effect.tryPromise(async () => {
          return await axios.get<GoogleGeocodeResponse>(
            'https://maps.googleapis.com/maps/api/geocode/json',
            {
              params: {
                key: apiKey,
                language: lang,
                result_type: 'locality|political',
                latlng: `${latitude},${longitude}`,
              },
            }
          )
        }),
        Effect.catchAll((e) => {
          return Effect.zipRight(
            Effect.logError('Error while requesting geocode', e),
            new UnexpectedServerError({
              detail: 'ExternalApi' as const,
              status: 500,
            })
          )
        })
      )

      const firstHit = response.data.results.at(0)
      if (!firstHit) return yield* _(new LocationNotFoundError({status: 404}))

      yield* _(
        Effect.log(
          'Got geocode response',
          firstHit.address_components.map(
            (one) => `${one.short_name} - ${one.types.join(', ')}`
          )
        )
      )

      const country = findTypeInAddressComponents(
        'country',
        firstHit.address_components
      )

      // 3FF2+M4H Praha, Česko
      const compoundCode = response.data.plus_code.compound_code
      // Praha, Česko
      const cityAndState = compoundCode.split(' ').slice(1).join(' ')
      // Praha - CZ
      const cityAndStateShorten = cityAndState.replace(
        /,([^,]*)$/,
        ` - ${country}`
      )
      const cityOrPartOfTheCity = findNextLevelArea(firstHit)
      const finalAddress = compoundCodeContainsCity(
        compoundCode,
        cityOrPartOfTheCity
      )
        ? // Karlovy Vary - CZ
          cityAndStateShorten
        : // Vinohrady, Praha - CZ
          `${cityOrPartOfTheCity}, ${cityAndStateShorten}`

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

      const address =
        country && cityOrPartOfTheCity
          ? finalAddress
          : firstHit.formatted_address.replace(/^[\d\s]*/, '')

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
      Effect.catchTag('ParseError', (e) =>
        Effect.zipRight(
          Effect.logError('Unexpected response from google api', e),
          new UnexpectedServerError({
            status: 500,
            detail: 'ExternalApi' as const,
          })
        )
      ),
      Effect.catchAllDefect((defect) => {
        return Effect.zipRight(
          Effect.logError('Error defect while getting geocode', defect),
          new UnexpectedServerError({
            detail: 'ExternalApi' as const,
            status: 500,
          })
        )
      })
    )
  }
