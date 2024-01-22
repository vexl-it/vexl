// TODO move to domain or rest-api package

import {z} from 'zod'

export const LocationData = z.object({
  placeId: z.string(),
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

  /** Depreciated, left for backwards compatibility */
  municipality: z.string(),
  region: z.string(),
  country: z.string(),
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
  count: z
    .string()
    .default('10')
    // Not nice, well 🤷‍♂️... https://github.com/honojs/middleware/issues/98
    .transform((e) => +e)
    .pipe(z.number().int()),
  phrase: z.string().min(1),
  lang: z.string().min(2),
})
export type SuggestQueryData = z.TypeOf<typeof SuggestQueryData>

export const GeocodeQueryData = z.object({
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
export type GeocodeQueryData = z.TypeOf<typeof GeocodeQueryData>

export const GeocodeResponse = z.object({
  placeId: z.string(),
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
export type GeocodeResponse = z.TypeOf<typeof GeocodeResponse>
