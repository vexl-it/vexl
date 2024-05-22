import {Schema} from '@effect/schema'
import {InternalServerError} from '@vexl-next/rest-api/src/Errors'
import {
  GetLocationSuggestionsResponse,
  type GetLocationSuggestionsRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import axios from 'axios'
import {Effect} from 'effect'
import {Environment} from '../EnvironmentLayer'

interface GooglePlacesResponse {
  results: Array<{
    formatted_address: string
    place_id: string
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
    types: string[]
  }>
}

export function querySuggest({
  phrase,
  lang,
}: GetLocationSuggestionsRequest): Effect.Effect<
  GetLocationSuggestionsResponse,
  InternalServerError,
  Environment
> {
  return Effect.gen(function* (_) {
    const googlePlacesApikey = yield* _(Environment.GOOGLE_PLACES_API_KEY)
    const {
      data: {results},
    } = yield* _(
      Effect.tryPromise(async () => {
        return await axios.get<GooglePlacesResponse>(
          'https://maps.googleapis.com/maps/api/geocode/json',
          {
            params: {
              address: phrase,
              key: googlePlacesApikey,
              language: lang,
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

    const resultsRaw = results.map((one) => {
      const [firstRow, ...rest] = one.formatted_address.split(', ')
      const secondRow: string = rest.join(', ')
      return {
        userData: {
          placeId: one.place_id,
          suggestFirstRow: firstRow,
          suggestSecondRow: secondRow,
          latitude: one.geometry.location.lat,
          longitude: one.geometry.location.lng,
          viewport: {
            northeast: {
              latitude: one.geometry.viewport.northeast.lat,
              longitude: one.geometry.viewport.northeast.lng,
            },
            southwest: {
              latitude: one.geometry.viewport.southwest.lat,
              longitude: one.geometry.viewport.southwest.lng,
            },
          },
          municipality: firstRow,
          region: secondRow,
          country: secondRow,
        },
      }
    })

    return yield* _(
      Schema.decode(GetLocationSuggestionsResponse)({result: resultsRaw})
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
