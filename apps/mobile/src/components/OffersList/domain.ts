import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {type Atom} from 'jotai'

export type MarketplaceSection = 'FAVOURITES' | 'BROWSE' | 'ARCHIVED'
export type MyOffersSection = 'ACTIVE' | 'PAUSED'
export type OffersListSection = MarketplaceSection | MyOffersSection

export interface OffersListSectionHeaderItem {
  readonly type: 'sectionHeader'
  readonly key: string
  readonly section: OffersListSection
}

export interface OffersListOfferItem {
  readonly type: 'offer'
  readonly key: string
  readonly offerAtom: Atom<OneOfferInState>
  readonly swipeEnabled: boolean
}

export type OffersListItemData =
  | OffersListSectionHeaderItem
  | OffersListOfferItem
