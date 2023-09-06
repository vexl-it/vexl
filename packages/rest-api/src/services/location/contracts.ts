import {z} from 'zod'

export const GetLocationSuggestionsRequest = z.object({
  phrase: z.string().min(1),
  lang: z.string().min(2),
})
export type GetLocationSuggestionsRequest = z.TypeOf<
  typeof GetLocationSuggestionsRequest
>

export const LocationData = z.object({
  suggestFirstRow: z.string(),
  suggestSecondRow: z.string(),
  municipality: z.string(),
  region: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
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
