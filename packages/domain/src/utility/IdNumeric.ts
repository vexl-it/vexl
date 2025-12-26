// TODO this should not exist
import {Schema} from 'effect'

export const IdNumeric = Schema.Number
export type IdNumeric = Schema.Schema.Type<typeof IdNumeric>
