import {atom} from 'jotai'
import {isOfferExpired} from '../../../utils/isOfferExpired'
import {importedContactsHashesAtom} from '../../contacts/atom/contactsStore'
import {offersAtom} from './offersState'

export const offersToSeeInMarketplaceAtom = atom((get) => {
  const importedContactsHashes = get(importedContactsHashesAtom)

  return get(offersAtom).filter(
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
        oneOffer.offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE'))
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
