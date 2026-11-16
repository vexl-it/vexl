import {
  type MyOfferInState,
  type OfferAdminId,
  type OfferType,
} from '@vexl-next/domain/src/general/offers'
import {
  quickOfferTypesForIntent,
  type TradingIntent,
} from '@vexl-next/domain/src/general/quickOffers'
import {Array, pipe} from 'effect'

export interface QuickOffersReconciliationPlan {
  readonly toCreate: readonly OfferType[]
  readonly toDelete: readonly OfferAdminId[]
}

// Keeps the first quick offer of every wanted type and deletes the rest, so
// duplicates (e.g. after a restore raced a creation) heal on the next run.
export const planQuickOffersReconciliation = ({
  tradingIntent,
  quickOffersEnabled,
  myQuickOffers,
}: {
  readonly tradingIntent: TradingIntent
  readonly quickOffersEnabled: boolean
  readonly myQuickOffers: readonly MyOfferInState[]
}): QuickOffersReconciliationPlan => {
  const wantedTypes = quickOffersEnabled
    ? quickOfferTypesForIntent(tradingIntent)
    : []
  const kept = pipe(
    wantedTypes,
    Array.filterMap((offerType) =>
      Array.findFirst(
        myQuickOffers,
        (offer) => offer.offerInfo.publicPart.offerType === offerType
      )
    )
  )
  const keptAdminIds = Array.map(kept, (offer) => offer.ownershipInfo.adminId)

  return {
    toCreate: Array.filter(
      wantedTypes,
      (offerType) =>
        !Array.some(
          kept,
          (offer) => offer.offerInfo.publicPart.offerType === offerType
        )
    ),
    toDelete: pipe(
      myQuickOffers,
      Array.map((offer) => offer.ownershipInfo.adminId),
      Array.filter((adminId) => !Array.contains(keptAdminIds, adminId))
    ),
  }
}
