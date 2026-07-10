import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Array, pipe} from 'effect'
import {atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {
  type MarketplaceSection,
  type OffersListItemData,
} from '../../../components/OffersList/domain'
import {groupOffersByMark} from '../utils/offersByMark'
import {offersFilterFromStorageAtom} from './filterAtoms'
import {filteredOffersIncludingLocationFilterAtom} from './filteredOffers'

interface MarketplaceOffersSection {
  readonly section: MarketplaceSection
  readonly showHeader: boolean
  readonly offers: readonly OneOfferInState[]
}

const sectionedMarketplaceOffersAtom = atom(
  (get): MarketplaceOffersSection[] => {
    const visibleSection = get(offersFilterFromStorageAtom).visibleSection
    const {favourites, browse, archived} = groupOffersByMark(
      get(filteredOffersIncludingLocationFilterAtom)
    )

    const hasMarkedOffers =
      Array.isNonEmptyArray(favourites) || Array.isNonEmptyArray(archived)

    const sections: MarketplaceOffersSection[] =
      visibleSection === 'ONLY_FAVOURITES'
        ? [{section: 'FAVOURITES', showHeader: true, offers: favourites}]
        : visibleSection === 'ONLY_ARCHIVED'
          ? [{section: 'ARCHIVED', showHeader: true, offers: archived}]
          : [
              {section: 'FAVOURITES', showHeader: true, offers: favourites},
              // when nothing is marked the marketplace looks like a plain
              // list without section headers
              {section: 'BROWSE', showHeader: hasMarkedOffers, offers: browse},
              {section: 'ARCHIVED', showHeader: true, offers: archived},
            ]

    return pipe(
      sections,
      Array.filter((one) => Array.isNonEmptyReadonlyArray(one.offers))
    )
  }
)

const visibleMarketplaceOffersAtom = atom((get) =>
  pipe(
    get(sectionedMarketplaceOffersAtom),
    Array.flatMap((one) => one.offers)
  )
)

// one splitAtom over the concatenated array keyed by offerId keeps the
// per-offer atoms stable when an offer moves between sections (only the
// order changes) which is what makes the list layout animation see a move
// instead of a remove + insert
const visibleMarketplaceOffersAtomsAtom = splitAtom(
  visibleMarketplaceOffersAtom,
  (offer) => offer.offerInfo.offerId
)

export const visibleMarketplaceOffersCountAtom = atom(
  (get) => get(visibleMarketplaceOffersAtom).length
)

export const marketplaceListDataAtom = atom((get): OffersListItemData[] => {
  const sections = get(sectionedMarketplaceOffersAtom)
  const offerAtoms = get(visibleMarketplaceOffersAtomsAtom)

  const items: OffersListItemData[] = []
  let offerIndex = 0
  for (const {section, showHeader, offers} of sections) {
    if (showHeader)
      items.push({
        type: 'sectionHeader',
        key: `sectionHeader-${section}`,
        section,
      })

    for (const offer of offers) {
      const offerAtom = offerAtoms[offerIndex]
      offerIndex += 1
      if (offerAtom !== undefined)
        items.push({
          type: 'offer',
          key: offer.offerInfo.offerId,
          offerAtom,
          swipeEnabled: true,
        })
    }
  }

  return items
})
