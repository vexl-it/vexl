import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Schema} from 'effect'

export const OfferStats = Schema.Struct({
  countryPrefix: CountryPrefix,
  count: Schema.NonNegativeInt,
})
export type OfferStats = Schema.Schema.Type<typeof OfferStats>

export const OfferStatsResponse = Schema.Array(OfferStats)
export type OfferStatsResponse = Schema.Schema.Type<typeof OfferStatsResponse>
