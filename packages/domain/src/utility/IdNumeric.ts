import {z} from 'zod'

export const IdNumeric = z.number().int().min(0)
export type IdNumeric = z.TypeOf<typeof IdNumeric>
