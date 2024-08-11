import {Schema} from '@effect/schema'
import {z} from 'zod'
export const ServiceUrl = z.string().url().brand<'ServiceUrl'>()
export type ServiceUrl = z.infer<typeof ServiceUrl>

export const ServiceUrlE = Schema.NonEmptyString.pipe(
  Schema.brand('ServiceUrl')
)
export type ServiceUrlE = Schema.Schema.Type<typeof ServiceUrlE>
