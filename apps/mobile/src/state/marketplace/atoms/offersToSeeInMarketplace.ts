import {atom} from 'jotai'
import {isOfferExpired} from '../../../utils/isOfferExpired'
import {isDeveloperAtom} from '../../../utils/preferences'
import reportError from '../../../utils/reportError'
import {importedContactsHashesAtom} from '../../contacts/atom/contactsStore'
import {type OfferInfo} from './../../../../../../packages/domain/src/general/offers'
import {offersAtom} from './offersState'

export function alertAndReportOnlineOffersWithoutLocation(
  offers: OfferInfo[],
  reportOffersPayload: boolean = false
): void {
  const onlineOffersWithoutLocation = offers.filter(
    (one) =>
      one.publicPart.locationState === 'IN_PERSON' &&
      one.publicPart.location.length === 0
  )
  alert(
    `Found ${
      onlineOffersWithoutLocation.length
    } in person offers without location. ${
      onlineOffersWithoutLocation.length > 0
        ? 'Reporting to sentry.'
        : 'Everything is cool! 👍'
    }`
  )

  if (onlineOffersWithoutLocation.length > 0)
    reportError('warn', new Error('Found some offers without location'), {
      onlineOffersWithoutLocation: reportOffersPayload
        ? onlineOffersWithoutLocation
        : onlineOffersWithoutLocation.map((one) => one.offerId),
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
        oneOffer.offerInfo.publicPart.locationState !== 'IN_PERSON' ||
        oneOffer.offerInfo.publicPart.location.length > 0)
  )
})

export const areThereOffersToSeeInMarketplaceWithoutFiltersAtom = atom(
  (get) => get(offersToSeeInMarketplaceAtom).length > 0
)

export const buyOffersToSeeInMarketplaceCountAtom = atom((get) => {
  const offers = get(offersToSeeInMarketplaceAtom)
  return offers.filter(
    (offer) => offer.offerInfo.publicPart.offerType === 'BUY'
  ).length
})

export const sellOffersToSeeInMarketplaceCountAtom = atom((get) => {
  const offers = get(offersToSeeInMarketplaceAtom)
  return offers.filter(
    (offer) => offer.offerInfo.publicPart.offerType === 'SELL'
  ).length
})
