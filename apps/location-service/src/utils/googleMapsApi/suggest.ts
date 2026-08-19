import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  GetLocationSuggestionsResponse,
  type GetLocationSuggestionsRequest,
} from '@vexl-next/rest-api/src/services/location/contracts'
import axios from 'axios'
import {Effect, Redacted, Schema} from 'effect'
import {GoogleCoordinates, GoogleResponseEnvelope} from './common'
import {unexpectedGoogleMapsError} from './errors'

const GooglePlacesResponse = Schema.Struct({
  status: Schema.Literal('OK'),
  results: Schema.Array(
    Schema.Struct({
      formatted_address: Schema.String,
      place_id: Schema.String,
      geometry: Schema.Struct({
        location: GoogleCoordinates,
        viewport: Schema.Struct({
          northeast: GoogleCoordinates,
          southwest: GoogleCoordinates,
        }),
      }),
    })
  ),
})

export const querySuggest =
  (googlePlacesApiKey: Redacted.Redacted<string>) =>
  ({
    phrase,
    lang,
  }: GetLocationSuggestionsRequest): Effect.Effect<
    GetLocationSuggestionsResponse,
    UnexpectedServerError
  > => {
    return Effect.gen(function* (_) {
      const response = yield* _(
        Effect.tryPromise({
          try: async () =>
            await axios.get<unknown>(
              'https://maps.googleapis.com/maps/api/geocode/json',
              {
                params: {
                  address: phrase,
                  key: Redacted.value(googlePlacesApiKey),
                  language: lang,
                },
              }
            ),
          catch: (error) =>
            unexpectedGoogleMapsError({
              operation: 'suggest',
              category: 'RequestFailed',
              error,
              request: {phrase, lang},
            }),
        })
      )

      const responseEnvelope = yield* _(
        Schema.decodeUnknown(GoogleResponseEnvelope)(response.data)
      )
      if (responseEnvelope.status === 'ZERO_RESULTS') {
        return yield* _(
          Schema.decode(GetLocationSuggestionsResponse)({result: []})
        )
      }
      if (responseEnvelope.status !== 'OK') {
        return yield* _(
          unexpectedGoogleMapsError({
            operation: 'suggest',
            category: 'ResponseRejected',
            request: {phrase, lang},
            response: response.data,
            responseStatus: responseEnvelope.status,
          })
        )
      }

      const {results} = yield* _(
        Schema.decodeUnknown(GooglePlacesResponse)(response.data)
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
      Effect.catchTag(
        'ParseError',
        (error) =>
          new UnexpectedServerError({
            status: 500,
            message: 'Google Maps suggest response failed validation',
            cause: error,
          })
      )
    )
  }
