import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {atom, type Atom} from 'jotai'
import {importedContactsAtom} from '../../contacts'
import {type OffersFilter} from '../domain'
import areIncluded from '../utils/areIncluded'
import filterOffersByText from '../utils/filterOffersByText'
import isSomeIn30KmRange from '../utils/isIn30KmRadius'
import sortOffers from '../utils/sortOffers'
import {offersToSeeInMarketplaceAtom} from './offersToSeeInMarketplace'

export function createFilteredOffersAtom(
  filter: OffersFilter
): Atom<OneOfferInState[]> {
  return atom((get) => {
    const offersToSeeInMarketplace = get(offersToSeeInMarketplaceAtom)
    const textFilter = filter.text

    const filtered = offersToSeeInMarketplace.filter(
      (offer) =>
        (!filter.currency ||
          filter.currency.includes(offer.offerInfo.publicPart.currency)) &&
        (!filter.location ||
          filter.location.every((one) =>
            isSomeIn30KmRange(one, offer.offerInfo.publicPart.location)
          )) &&
        (!filter.paymentMethod ||
          areIncluded(
            filter.paymentMethod,
            offer.offerInfo.publicPart.paymentMethod
          )) &&
        (!filter.btcNetwork ||
          areIncluded(
            filter.btcNetwork,
            offer.offerInfo.publicPart.btcNetwork
          )) &&
        (!filter.friendLevel ||
          (filter.friendLevel.includes('FIRST_DEGREE') &&
          !filter.friendLevel.includes('SECOND_DEGREE')
            ? areIncluded(
                filter.friendLevel,
                offer.offerInfo.privatePart.friendLevel
              )
            : true)) &&
        (!filter.offerType ||
          offer.offerInfo.publicPart.offerType === filter.offerType) &&
        (!filter.amountBottomLimit ||
          offer.offerInfo.publicPart.amountBottomLimit >=
            filter.amountBottomLimit) &&
        (!filter.amountTopLimit ||
          offer.offerInfo.publicPart.amountTopLimit <= filter.amountTopLimit) &&
        (filter.spokenLanguages.length === 0 ||
          filter.spokenLanguages.some((item) =>
            offer.offerInfo.publicPart.spokenLanguages.includes(item)
          ))
    )

    // This could be rewritten with pipe, i know, i know...
    const filteredByText = textFilter
      ? filterOffersByText({
          text: textFilter,
          offers: filtered,
          importedContacts: get(importedContactsAtom),
        })
      : filtered

    return sortOffers(filteredByText, filter.sort ?? 'NEWEST_OFFER')
  })
}
