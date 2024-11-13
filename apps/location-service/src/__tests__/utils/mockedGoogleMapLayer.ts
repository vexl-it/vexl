import {jest} from '@jest/globals'
import {LocationPlaceIdE} from '@vexl-next/domain/src/general/offers'
import {
  LatitudeE,
  LongitudeE,
} from '@vexl-next/domain/src/utility/geoCoordinates'
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
        placeId: Schema.decodeSync(LocationPlaceIdE)('placeid'),
        address: 'address',
        latitude: Schema.decodeSync(LatitudeE)(2),
        longitude: Schema.decodeSync(LongitudeE)(4),
        viewport: {
          northeast: {
            latitude: Schema.decodeSync(LatitudeE)(2),
            longitude: Schema.decodeSync(LongitudeE)(4),
          },
          southwest: {
            latitude: Schema.decodeSync(LatitudeE)(2),
            longitude: Schema.decodeSync(LongitudeE)(4),
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
              latitude: Schema.decodeSync(LatitudeE)(2),
              longitude: Schema.decodeSync(LongitudeE)(4),
              placeId: Schema.decodeSync(LocationPlaceIdE)('placeid'),
              suggestFirstRow: 'suggestFirstRow',
              suggestSecondRow: 'suggestSecondRow',
              viewport: {
                northeast: {
                  latitude: Schema.decodeSync(LatitudeE)(2),
                  longitude: Schema.decodeSync(LongitudeE)(4),
                },
                southwest: {
                  latitude: Schema.decodeSync(LatitudeE)(2),
                  longitude: Schema.decodeSync(LongitudeE)(4),
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
