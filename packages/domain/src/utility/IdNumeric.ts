// TODO this should not exist
import {Schema} from 'effect'
import {z} from 'zod'

export const IdNumeric = z.number()
export const IdNumericE = Schema.Number
export type IdNumeric = Schema.Schema.Type<typeof IdNumericE>
