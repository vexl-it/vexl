import {z} from 'zod'

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

export const LocationResult = z.object({
  userData: LocationData,
})

export const LocationResponse = z.object({
  result: z.array(LocationResult),
})
export type LocationResponse = z.TypeOf<typeof LocationResponse>

export const SuggestQueryData = z.object({
  count: z.coerce.number().int().optional().default(10),
  phrase: z.string().min(1),
  lang: z.string().min(2),
})
export type SuggestQueryData = z.TypeOf<typeof SuggestQueryData>
