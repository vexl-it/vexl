import {z} from 'zod'

export const IdNumeric = z.number().int().positive()
export type IdNumeric = z.TypeOf<typeof IdNumeric>
