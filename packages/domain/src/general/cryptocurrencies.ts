import {z} from 'zod'

export const Coin = z.string().trim().min(1).brand<'Coin'>()
export type Coin = z.TypeOf<typeof Coin>
