import {Schema} from 'effect'
import {CurrencyCode} from './currency.brand'
import {type OfferPublicPart, type OfferType} from './offers'

// The answer to "How do you want to use Vexl?" after login.
export const TradingIntent = Schema.Literal('BUY', 'SELL', 'BOTH')
export type TradingIntent = typeof TradingIntent.Type

export const quickOfferTypesForIntent = (
  intent: TradingIntent
): readonly OfferType[] => (intent === 'BOTH' ? ['BUY', 'SELL'] : [intent])

export const isQuickOffer = (offer: {
  readonly offerInfo: {readonly publicPart: OfferPublicPart}
}): boolean => offer.offerInfo.publicPart.isQuickOffer === true

export const oppositeOfferType = (offerType: OfferType): OfferType =>
  offerType === 'BUY' ? 'SELL' : 'BUY'

const PositiveAmount = Schema.Number.pipe(Schema.finite(), Schema.positive())

// The optional amount a quick connect request carries inside the encrypted
// chat payload, so the receiver's app can show it in its own language.
export const QuickConnectAmount = Schema.Union(
  Schema.TaggedStruct('BtcAmount', {btc: PositiveAmount}),
  Schema.TaggedStruct('FiatAmount', {
    amount: PositiveAmount,
    currency: CurrencyCode,
  })
)
export type QuickConnectAmount = typeof QuickConnectAmount.Type
