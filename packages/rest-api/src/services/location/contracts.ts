import {LocationPlaceId} from '@vexl-next/domain/src/general/offers'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {z} from 'zod'

export const GetLocationSuggestionsRequest = z.object({
  count: z
    .string()
    .default('10')
    // Not nice, well 🤷‍♂️... https://github.com/honojs/middleware/issues/98
    .transform((e) => +e)
    .pipe(z.number().int()),
  phrase: z.string().min(1),
  lang: z.string().min(2),
})
export type GetLocationSuggestionsRequest = z.TypeOf<
  typeof GetLocationSuggestionsRequest
>

export const LocationData = z.object({
  placeId: LocationPlaceId,
  suggestFirstRow: z.string(),
  suggestSecondRow: z.string(),
  latitude: Latitude,
  longitude: Longitude,
  viewport: z.object({
    northeast: z.object({
      latitude: Latitude,
      longitude: Longitude,
    }),
    southwest: z.object({
      latitude: Latitude,
      longitude: Longitude,
    }),
  }),
})

export type LocationData = z.TypeOf<typeof LocationData>

export const LocationSuggestion = z.object({
  userData: LocationData,
})

export type LocationSuggestion = z.TypeOf<typeof LocationSuggestion>

export const GetLocationSuggestionsResponse = z.object({
  result: z.array(LocationSuggestion),
})
export type GetLocationSuggestionsResponse = z.TypeOf<
  typeof GetLocationSuggestionsResponse
>

export const GetGeocodedCoordinatesRequest = z.object({
  latitude: Latitude,
  longitude: Longitude,
  lang: z.string().min(2),
})
export type GetGeocodedCoordinatesRequest = z.TypeOf<
  typeof GetGeocodedCoordinatesRequest
>

export const GetGeocodedCoordinatesResponse = z.object({
  placeId: LocationPlaceId,
  address: z.string(),
  latitude: Latitude,
  longitude: Longitude,
  viewport: z.object({
    northeast: z.object({
      latitude: Latitude,
      longitude: Longitude,
    }),
    southwest: z.object({
      latitude: Latitude,
      longitude: Longitude,
    }),
  }),
})
export type GetGeocodedCoordinatesResponse = z.TypeOf<
  typeof GetGeocodedCoordinatesResponse
>

export interface LocationNotFoundError {
  _tag: 'LocationNotFoundError'
}
