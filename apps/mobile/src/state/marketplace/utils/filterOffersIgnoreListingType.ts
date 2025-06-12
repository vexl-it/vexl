import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array} from 'effect'
import areIncluded from '../atoms/filteredOffers'
import {type OffersFilter} from '../domain'

export const filterOffersIgnoreListingType = ({
  filter,
  layoutMode,
  allOffersToFilter,
}: {
  filter: OffersFilter
  layoutMode: 'map' | 'list'
  allOffersToFilter: OneOfferInState[]
}): OneOfferInState[] =>
  allOffersToFilter.filter(
    (offer) =>
      (!filter.currency ||
        filter.currency.includes(offer.offerInfo.publicPart.currency)) &&
      (layoutMode === 'list' ||
        offer.offerInfo.publicPart.location.length > 0) &&
      (!filter.locationState ||
        areIncluded(
          filter.locationState,
          offer.offerInfo.publicPart.locationState
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
      (!filter.amountTopLimit ||
        offer.offerInfo.publicPart.amountBottomLimit <=
          filter.amountTopLimit) &&
      (!filter.amountBottomLimit ||
        offer.offerInfo.publicPart.amountTopLimit >=
          filter.amountBottomLimit) &&
      (filter.spokenLanguages.length === 0 ||
        filter.spokenLanguages.some((item) =>
          offer.offerInfo.publicPart.spokenLanguages.includes(item)
        )) &&
      (!filter.clubsUuids ||
        offer.offerInfo.privatePart.clubIds.length === 0 ||
        Array.isNonEmptyArray(
          Array.intersection(
            offer.offerInfo.privatePart.clubIds,
            filter.clubsUuids
          )
        ))
  )
