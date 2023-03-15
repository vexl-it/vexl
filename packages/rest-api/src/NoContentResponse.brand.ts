import {z, type ZodVoid} from 'zod'
export const NoContentResponse = z.custom<ZodVoid>(
  (value) => value === undefined || value === null || value === ''
)
export type NoContentResponse = z.TypeOf<typeof NoContentResponse>
