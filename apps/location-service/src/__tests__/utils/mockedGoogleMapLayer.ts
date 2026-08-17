import {jest} from '@jest/globals'
import {LocationPlaceId} from '@vexl-next/domain/src/general/offers'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {
  GetGeocodedCoordinatesResponse,
  GetLocationSuggestionsResponse,
} from '@vexl-next/rest-api/src/services/location/contracts'
import {Effect, Layer, Schema} from 'effect'
import {
  GoogleMapsService,
  type GoogleMapsOperations,
} from '../../utils/googleMapsApi'

export const queryGeocodeMock = jest.fn<GoogleMapsOperations['queryGeocode']>(
  () =>
    Effect.succeed(
      new GetGeocodedCoordinatesResponse({
        placeId: Schema.decodeSync(LocationPlaceId)('placeid'),
        address: 'address',
        latitude: Schema.decodeSync(Latitude)(2),
        longitude: Schema.decodeSync(Longitude)(4),
        viewport: {
          northeast: {
            latitude: Schema.decodeSync(Latitude)(2),
            longitude: Schema.decodeSync(Longitude)(4),
          },
          southwest: {
            latitude: Schema.decodeSync(Latitude)(2),
            longitude: Schema.decodeSync(Longitude)(4),
          },
        },
      })
    )
)

export const querySuggestMock = jest.fn<GoogleMapsOperations['querySuggest']>(
  () =>
    Effect.succeed(
      Schema.decodeSync(GetLocationSuggestionsResponse)({
        result: [
          {
            userData: {
              latitude: Schema.decodeSync(Latitude)(2),
              longitude: Schema.decodeSync(Longitude)(4),
              placeId: Schema.decodeSync(LocationPlaceId)('placeid'),
              suggestFirstRow: 'suggestFirstRow',
              suggestSecondRow: 'suggestSecondRow',
              viewport: {
                northeast: {
                  latitude: Schema.decodeSync(Latitude)(2),
                  longitude: Schema.decodeSync(Longitude)(4),
                },
                southwest: {
                  latitude: Schema.decodeSync(Latitude)(2),
                  longitude: Schema.decodeSync(Longitude)(4),
                },
              },
            },
          },
        ],
      })
    )
)

export const mockedGoogleMapLayer = Layer.effect(
  GoogleMapsService,
  Effect.succeed({
    queryGeocode: queryGeocodeMock,
    querySuggest: querySuggestMock,
  })
)
