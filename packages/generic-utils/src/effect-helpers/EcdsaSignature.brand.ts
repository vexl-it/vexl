import {Schema} from 'effect/index'

export const EcdsaSignature = Schema.String.pipe(Schema.brand('EcdsaSignature'))
export type EcdsaSignature = Schema.Schema.Type<typeof EcdsaSignature>
