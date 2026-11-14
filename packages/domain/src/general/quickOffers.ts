import {Schema} from 'effect'
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
