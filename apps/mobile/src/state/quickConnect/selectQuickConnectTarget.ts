import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, type Option, Order, pipe} from 'effect'

export const QUICK_CONNECT_TOP_CANDIDATES = 3

export interface QuickConnectCandidate {
  readonly offer: OneOfferInState
  readonly commonFriendsCount: number
}

const byMostCommonFriends = Order.reverse(
  Order.mapInput(
    Order.number,
    (candidate: QuickConnectCandidate) => candidate.commonFriendsCount
  )
)

export function rankQuickConnectCandidates({
  offers,
  commonFriendsCount,
  canBeRequested,
}: {
  readonly offers: readonly OneOfferInState[]
  readonly commonFriendsCount: (offer: OneOfferInState) => number
  readonly canBeRequested: (offer: OneOfferInState) => boolean
}): readonly QuickConnectCandidate[] {
  return pipe(
    offers,
    Array.filter(
      (offer) =>
        !offer.ownershipInfo && !offer.flags.reported && canBeRequested(offer)
    ),
    Array.map((offer) => ({
      offer,
      commonFriendsCount: commonFriendsCount(offer),
    })),
    Array.sort(byMostCommonFriends)
  )
}

// Random among the best few, so the best connected person is not asked by
// everyone in the network.
export function pickQuickConnectTarget(
  rankedCandidates: readonly QuickConnectCandidate[],
  random: () => number
): Option.Option<QuickConnectCandidate> {
  const topCandidates = Array.take(
    rankedCandidates,
    QUICK_CONNECT_TOP_CANDIDATES
  )
  return Array.get(topCandidates, Math.floor(random() * topCandidates.length))
}
