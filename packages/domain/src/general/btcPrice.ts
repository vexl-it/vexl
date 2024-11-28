import {Schema} from 'effect'
import {UnixMillisecondsE} from '../utility/UnixMilliseconds.brand'

const BtcPriceFetched = Schema.Struct({
  BTC: Schema.Number,
  lastUpdatedAt: Schema.optionalWith(UnixMillisecondsE, {as: 'Option'}),
})

export const BtcPriceDataWithState = Schema.Union(
  Schema.Struct({
    state: Schema.Literal('loading'),
    btcPrice: Schema.optional(BtcPriceFetched),
  }),
  Schema.Struct({
    state: Schema.Literal('success'),
    btcPrice: BtcPriceFetched,
    lastRefreshAt: UnixMillisecondsE,
  }),
  Schema.Struct({
    state: Schema.Literal('error'),
    btcPrice: Schema.optional(BtcPriceFetched),
    error: Schema.Unknown,
  })
)

export type BtcPriceDataWithState = typeof BtcPriceDataWithState.Type
