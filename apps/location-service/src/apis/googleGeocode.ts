import {Schema} from '@effect/schema'
import {
  InternalServerError,
  NotFoundError,
} from '@vexl-next/rest-api/src/Errors'
import {
  GetGeocodedCoordinatesResponse,
  type GetGeocodedCoordinatesRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import axios from 'axios'
import {Effect} from 'effect'
import {EnvironmentConstants, type Environment} from '../EnvironmentLayer'

interface GoogleGeocodeResponse {
  results: Array<{
    place_id: string
    formatted_address: string
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
  }>
}

export default function googleGeocode({
  latitude,
  longitude,
  lang,
}: GetGeocodedCoordinatesRequest): Effect.Effect<
  GetGeocodedCoordinatesResponse,
  InternalServerError | NotFoundError,
  Environment
> {
  return Effect.gen(function* (_) {
    const apiKey = yield* _(EnvironmentConstants.GOOGLE_PLACES_API_KEY)
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
          new InternalServerError({cause: 'ExternalApi' as const})
        )
      })
    )

    const firstHit = response.data.results.at(0)
    if (!firstHit) return yield* _(new NotFoundError())

    return yield* _(
      Schema.decode(GetGeocodedCoordinatesResponse)({
        placeId: firstHit.place_id,
        // Remove postal code from the start as per #865
        address: firstHit.formatted_address.replace(/^[\d\s]*/, ''),
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
        new InternalServerError({cause: 'ExternalApi' as const})
      )
    ),
    Effect.catchAllDefect((defect) => {
      return Effect.zipRight(
        Effect.logError('Error defect while getting geocode', defect),
        new InternalServerError({cause: 'ExternalApi' as const})
      )
    })
  )
}
