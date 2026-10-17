import {sentRequestClass} from '@vexl-next/analytics-definitions/src/coreAction'
import {
  type OfferId,
  type OneOfferInState,
} from '@vexl-next/domain/src/general/offers'
import {Array, Option} from 'effect'
import {useSetAtom} from 'jotai'
import {useEffect, useRef} from 'react'
import {
  reportOfferOpenedInWeekActionAtom,
  reportOffersVisibleInWeekActionAtom,
} from './activity'
import {reportAfterOpenActionAtom} from './afterOpenAction'
import {analyticsActionAtom} from './analyticsActionAtom'
import {
  reportFirstMarketplaceLoadActionAtom,
  updateOnboardingActionAtom,
} from './onboarding'

/** Main marketplace: the offer did not reach this device only through Clubs. */
const isMainMarketplaceOffer = (offer: OneOfferInState): boolean =>
  sentRequestClass(offer.offerInfo.privatePart.friendLevel) === 'main'

/** `offers` are the offers the marketplace shows, own offers excluded. */
export const reportMarketplaceLoadedActionAtom = analyticsActionAtom(
  (get, set, offers: readonly OneOfferInState[]) => {
    const mainOffersCount = Array.filter(offers, isMainMarketplaceOffer).length
    set(reportFirstMarketplaceLoadActionAtom, mainOffersCount)
    set(reportOffersVisibleInWeekActionAtom, mainOffersCount)
  }
)

const reportOfferOpenedActionAtom = analyticsActionAtom(
  (get, set, offer: OneOfferInState) => {
    if (isMainMarketplaceOffer(offer))
      set(updateOnboardingActionAtom, {offerOpened: true})
    set(reportOfferOpenedInWeekActionAtom)
    set(reportAfterOpenActionAtom, 'offerOpened')
  }
)

/** Reports each opened offer of someone else once per screen. */
export function useReportOfferOpened(
  offer: Option.Option<OneOfferInState>
): void {
  const reportOfferOpened = useSetAtom(reportOfferOpenedActionAtom)
  const reportedOfferIdRef = useRef<OfferId | undefined>(undefined)

  useEffect(() => {
    if (
      Option.isNone(offer) ||
      offer.value.ownershipInfo !== undefined ||
      reportedOfferIdRef.current === offer.value.offerInfo.offerId
    )
      return
    reportedOfferIdRef.current = offer.value.offerInfo.offerId
    reportOfferOpened(offer.value)
  }, [offer, reportOfferOpened])
}
