import {selectAtom} from 'jotai/utils'
import {offersAtom} from './offersState'
import {importedContactsHashesAtom} from '../../contacts'
import {atom} from 'jotai'

export const offersToSeeInMarketplaceAtom = atom((get) => {
  const importedContactsHashes = get(importedContactsHashesAtom)

  return get(offersAtom).filter(
    (oneOffer) =>
      // only active offers
      oneOffer.offerInfo.publicPart.active &&
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

export const buyOffersToSeeInMarketplaceCountAtom = selectAtom(
  offersToSeeInMarketplaceAtom,
  (offers) =>
    offers.filter((offer) => offer.offerInfo.publicPart.offerType === 'BUY')
      .length
)

export const sellOffersToSeeInMarketplaceCountAtom = selectAtom(
  offersToSeeInMarketplaceAtom,
  (offers) =>
    offers.filter((offer) => offer.offerInfo.publicPart.offerType === 'SELL')
      .length
)
