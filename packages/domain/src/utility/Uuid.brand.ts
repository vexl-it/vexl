import {z} from 'zod'

export const Uuid = z.string().uuid().brand<'Uuid'>()
export type Uuid = z.TypeOf<typeof Uuid>
