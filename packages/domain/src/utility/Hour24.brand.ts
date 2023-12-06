import {z} from 'zod'

export const Hour24 = z.number().min(0).max(23).brand('Hour24')
export type Hour24 = z.TypeOf<typeof Hour24>
