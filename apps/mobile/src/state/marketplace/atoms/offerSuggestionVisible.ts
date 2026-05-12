import {Array, Option, Schema} from 'effect/index'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {
  showCreateOfferInMarketplaceSuggestionAtom,
  showEnableNotificationsInMarketplaceSuggestionAtom,
  showImportContactsInMarketplaceSuggestionAtom,
} from '../../../utils/preferences'
import {reachNumberAtom} from '../../connections/atom/connectionStateAtom'
import {notificationsEnabledAtom} from '../../notifications/areNotificationsEnabledAtom'
import {REACH_NUMBER_THRESHOLD} from '../domain'
import {filteredOffersIncludingLocationFilterAtomsAtom} from './filteredOffers'
import {areThereAnyMyOffersAtom} from './myOffers'

export const addMoreContactsSuggestionVisibleAtom = atom<boolean>(true)
export const resetFilterSuggestionVisibleAtom = atom<boolean>(true)
export const joinVexlClubsSuggestionVisibleAtom = atom<boolean>(true)

export const createOfferSuggestionVisibleStorageAtom =
  atomWithParsedMmkvStorage(
    'createOfferSuggestionVisible',
    {
      visible: true,
    },
    Schema.Struct({
      visible: Schema.Boolean,
    })
  )

export const createOfferSuggestionVisibleAtom = focusAtom(
  createOfferSuggestionVisibleStorageAtom,
  (o) => o.prop('visible')
)

export const shouldShowCreateOfferInMarketplaceSuggestionAtom = atom((get) => {
  return (
    Array.isNonEmptyArray(
      get(filteredOffersIncludingLocationFilterAtomsAtom)
    ) &&
    !get(areThereAnyMyOffersAtom) &&
    get(showCreateOfferInMarketplaceSuggestionAtom)
  )
})

export const shouldShowImportContactsInMarketplaceSuggestionAtom = atom(
  (get) => {
    return (
      Array.isNonEmptyArray(
        get(filteredOffersIncludingLocationFilterAtomsAtom)
      ) &&
      get(reachNumberAtom) < REACH_NUMBER_THRESHOLD &&
      get(showImportContactsInMarketplaceSuggestionAtom)
    )
  }
)

export const shouldShowEnableNotificationsInMarketplaceSuggestionAtom = atom(
  (get) => {
    const notificationsEnabled = get(notificationsEnabledAtom)

    return (
      Array.isNonEmptyArray(
        get(filteredOffersIncludingLocationFilterAtomsAtom)
      ) &&
      Option.isSome(notificationsEnabled) &&
      !notificationsEnabled.value.notifications &&
      get(showEnableNotificationsInMarketplaceSuggestionAtom)
    )
  }
)

const marketplaceSuggestionDismissedThisSessionAtom = atom<boolean>(false)

export const marketplaceFirstOfferBannerAtom = atom<
  'importContacts' | 'enableNotifications' | 'createOffer' | null
>((get) => {
  if (get(shouldShowImportContactsInMarketplaceSuggestionAtom)) {
    return 'importContacts'
  }

  if (get(marketplaceSuggestionDismissedThisSessionAtom)) {
    return null
  }

  if (get(shouldShowEnableNotificationsInMarketplaceSuggestionAtom)) {
    return 'enableNotifications'
  }

  if (get(shouldShowCreateOfferInMarketplaceSuggestionAtom)) {
    return 'createOffer'
  }

  return null
})

export const dismissCreateOfferInMarketplaceSuggestionActionAtom = atom(
  null,
  (get, set) => {
    set(showCreateOfferInMarketplaceSuggestionAtom, false)
  }
)

export const dismissImportContactsInMarketplaceSuggestionActionAtom = atom(
  null,
  (get, set) => {
    set(showImportContactsInMarketplaceSuggestionAtom, false)
    set(marketplaceSuggestionDismissedThisSessionAtom, true)
  }
)

export const dismissEnableNotificationsInMarketplaceSuggestionActionAtom = atom(
  null,
  (get, set) => {
    set(showEnableNotificationsInMarketplaceSuggestionAtom, false)
    set(marketplaceSuggestionDismissedThisSessionAtom, true)
  }
)

export const resetImportContactsMarketplaceSuggestionSessionActionAtom = atom(
  null,
  (get, set) => {
    set(marketplaceSuggestionDismissedThisSessionAtom, false)
  }
)
