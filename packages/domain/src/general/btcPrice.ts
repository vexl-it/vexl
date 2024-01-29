import {z} from 'zod'
import {UnixMilliseconds} from '../utility/UnixMilliseconds.brand'

export const BtcPrice = z.number().positive().brand('BtcPrice')
export type BtcPrice = z.TypeOf<typeof BtcPrice>

export const BtcPriceDataWithState = z.discriminatedUnion('state', [
  z.object({
    state: z.literal('loading'),
    btcPrice: z.number().optional(),
  }),
  z.object({
    state: z.literal('success'),
    btcPrice: z.number(),
    lastRefreshAt: UnixMilliseconds,
  }),
  z.object({
    state: z.literal('error'),
    btcPrice: z.number().optional(),
    error: z.unknown(),
  }),
])

export type BtcPriceDataWithState = z.TypeOf<typeof BtcPriceDataWithState>
