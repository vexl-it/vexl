import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import {isOfferExpired} from '../../../utils/isOfferExpired'
import {isDeveloperAtom} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {importedContactsHashesAtom} from '../../contacts/atom/contactsStore'
import {deriveVisibleCommonFriendsForOffer} from '../utils/visibleCommonFriends'
import {offersAtom} from './offersState'

export function alertAndReportInPersonOffersWithoutLocation(
  offers: OfferInfo[],
  reportOffersPayload: boolean = false,
  showAlert: boolean = false
): void {
  const inPersonOffersWithoutLocation = offers.filter(
    (one) =>
      one.publicPart.listingType !== 'OTHER' &&
      one.publicPart.locationState.includes('IN_PERSON') &&
      one.publicPart.location.length === 0
  )

  if (showAlert)
    alert(
      `Found ${
        inPersonOffersWithoutLocation.length
      } in person offers without location. ${
        inPersonOffersWithoutLocation.length > 0
          ? 'Reporting to sentry.'
          : 'Everything is cool! 👍'
      }`
    )

  if (inPersonOffersWithoutLocation.length > 0)
    reportError('warn', new Error('Found some offers without location'), {
      inPersonOffersWithoutLocation: reportOffersPayload
        ? inPersonOffersWithoutLocation
        : inPersonOffersWithoutLocation.map((one) => one.offerId),
    })
}

export const reportOffersWithoutLocationActionAtom = atom(null, (get) => {
  alertAndReportInPersonOffersWithoutLocation(
    get(offersAtom).map((one) => one.offerInfo)
  )
})

export const offersToSeeInMarketplaceAtom = atom((get) => {
  const importedContactsHashes = get(importedContactsHashesAtom)
  const isDeveloper = get(isDeveloperAtom)

  const offers = get(offersAtom)
  alertAndReportInPersonOffersWithoutLocation(
    offers.map((one) => one.offerInfo)
  )

  return pipe(
    offers,
    Array.filter((oneOffer) => {
      const visibleCommonFriends = deriveVisibleCommonFriendsForOffer({
        offerInfo: oneOffer.offerInfo,
        importedContactsHashes,
      })

      return (
        // only active offers
        oneOffer.offerInfo.publicPart.active &&
        // only not expired offers
        !isOfferExpired(oneOffer.offerInfo.publicPart.expirationDate) &&
        // Not mine offers
        !oneOffer.ownershipInfo &&
        // Not reported offers
        !oneOffer.flags.reported &&
        // Offers that has at least one visible common contact or are first degree
        (Array.isNonEmptyReadonlyArray(visibleCommonFriends.commonFriends) ||
          pipe(
            oneOffer.offerInfo.privatePart.friendLevel,
            Array.some((one) => one === 'FIRST_DEGREE')
          ) ||
          pipe(
            oneOffer.offerInfo.privatePart.friendLevel,
            Array.some((one) => one === 'CLUB')
          )) &&
        // Filter offers that are set to be in person but have no location
        (isDeveloper ||
          oneOffer.offerInfo.publicPart.locationState.length === 0 ||
          pipe(
            oneOffer.offerInfo.publicPart.locationState,
            Array.some((one) => one === 'ONLINE')
          ) ||
          (pipe(
            oneOffer.offerInfo.publicPart.locationState,
            Array.some((one) => one === 'IN_PERSON')
          ) &&
            Array.isNonEmptyReadonlyArray(
              oneOffer.offerInfo.publicPart.location
            )))
      )
    })
  )
})

export const areThereOffersToSeeInMarketplaceWithoutFiltersAtom = atom(
  (get) => get(offersToSeeInMarketplaceAtom).length > 0
)
