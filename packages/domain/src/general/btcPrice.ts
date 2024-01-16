import {z} from 'zod'

export const BtcPriceDataWithState = z.object({
  btcPrice: z.number(),
  state: z.enum(['loading', 'success', 'error']),
})

export type BtcPriceDataWithState = z.TypeOf<typeof BtcPriceDataWithState>
