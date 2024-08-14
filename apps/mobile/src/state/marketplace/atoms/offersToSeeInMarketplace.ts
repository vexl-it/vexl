import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {atom} from 'jotai'
import {isOfferExpired} from '../../../utils/isOfferExpired'
import {isDeveloperAtom} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {importedContactsHashesAtom} from '../../contacts/atom/contactsStore'
import {offersAtom} from './offersState'

export function alertAndReportOnlineOffersWithoutLocation(
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
      onlineOffersWithoutLocation: reportOffersPayload
        ? inPersonOffersWithoutLocation
        : inPersonOffersWithoutLocation.map((one) => one.offerId),
    })
}

export const reportOffersWithoutLocationActionAtom = atom(null, (get) => {
  alertAndReportOnlineOffersWithoutLocation(
    get(offersAtom).map((one) => one.offerInfo)
  )
})

export const offersToSeeInMarketplaceAtom = atom((get) => {
  const importedContactsHashes = get(importedContactsHashesAtom)
  const isDeveloper = get(isDeveloperAtom)

  const offers = get(offersAtom)
  alertAndReportOnlineOffersWithoutLocation(offers.map((one) => one.offerInfo))

  return offers.filter(
    (oneOffer) =>
      // only active offers
      oneOffer.offerInfo.publicPart.active &&
      // only not expired offers
      !isOfferExpired(oneOffer.offerInfo.publicPart.expirationDate) &&
      // Not mine offers
      !oneOffer.ownershipInfo &&
      // Not reported offers
      !oneOffer.flags.reported &&
      // Offers that has at least one common contact or are first degree
      (oneOffer.offerInfo.privatePart.commonFriends.some((one) =>
        importedContactsHashes.includes(one)
      ) ||
        oneOffer.offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE')) &&
      // Filter offers that are set to be in person but have no location
      (isDeveloper ||
        oneOffer.offerInfo.publicPart.locationState.length === 0 ||
        oneOffer.offerInfo.publicPart.locationState.includes('ONLINE') ||
        (oneOffer.offerInfo.publicPart.locationState.includes('IN_PERSON') &&
          oneOffer.offerInfo.publicPart.location.length > 0))
  )
})

export const areThereOffersToSeeInMarketplaceWithoutFiltersAtom = atom(
  (get) => get(offersToSeeInMarketplaceAtom).length > 0
)
