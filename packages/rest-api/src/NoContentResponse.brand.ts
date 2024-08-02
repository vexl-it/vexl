import {Schema} from '@effect/schema'
import {z, type ZodVoid} from 'zod'
export const NoContentResponse = z.custom<ZodVoid>(
  (value) => value === undefined || value === null || value === ''
)
export const NoContentResponseE = Schema.Any
export type NoContentResponse = Schema.Schema.Type<typeof NoContentResponseE>
