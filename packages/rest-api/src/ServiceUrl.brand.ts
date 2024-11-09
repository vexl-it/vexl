import {Schema} from 'effect'

export const ServiceUrl = Schema.NonEmptyString.pipe(Schema.brand('ServiceUrl'))
export type ServiceUrl = Schema.Schema.Type<typeof ServiceUrl>
