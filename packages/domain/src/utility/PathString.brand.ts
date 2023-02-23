import {z} from 'zod'

export const PathString = z.string().min(1).brand<'PathString'>()
export type PathString = z.TypeOf<typeof PathString>
