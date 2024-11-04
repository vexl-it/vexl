import {Schema} from '@effect/schema'

export const ServiceUrl = Schema.NonEmptyString.pipe(Schema.brand('ServiceUrl'))
export type ServiceUrl = Schema.Schema.Type<typeof ServiceUrl>
