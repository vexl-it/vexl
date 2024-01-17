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
  suggestFirstRow: z.string(),
  suggestSecondRow: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  viewport: z.object({
    northeast: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    southwest: z.object({
      latitude: z.number(),
      longitude: z.number(),
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
  latitude: z
    .string()
    .default('10')
    // Not nice, well 🤷‍♂️... https://github.com/honojs/middleware/issues/98
    .transform((e) => +e)
    .pipe(z.number().min(-180).max(180)),
  longitude: z
    .string()
    .default('10')
    // Not nice, well 🤷‍♂️... https://github.com/honojs/middleware/issues/98
    .transform((e) => +e)
    .pipe(z.number().min(-90).max(90)),
  lang: z.string().min(2),
})
export type GetGeocodedCoordinatesRequest = z.TypeOf<
  typeof GetGeocodedCoordinatesRequest
>

export const GetGeocodedCoordinatesResponse = z.object({
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  viewport: z.object({
    northeast: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
    southwest: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }),
  }),
})
export type GetGeocodedCoordinatesResponse = z.TypeOf<
  typeof GetGeocodedCoordinatesResponse
>

export interface LocationNotFoundError {
  _tag: 'LocationNotFoundError'
}
