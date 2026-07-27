import {Array, Schema} from 'effect'
import {atom} from 'jotai'
import {filteredOffersIncludingLocationFilterAtom} from '../../state/marketplace/atoms/filteredOffers'
import {atomWithParsedMmkvStorageWithImmediateSaveOption} from '../atomUtils/atomWithParsedMmkvStorage'

const MarketplaceReadyNotificationStateSchema = Schema.Literal(
  'waitingForFirstOffer',
  'completed'
)

const MarketplaceReadyNotificationStoreSchema = Schema.Struct({
  notificationState: MarketplaceReadyNotificationStateSchema,
})

const defaultMarketplaceReadyNotificationStoreValue: typeof MarketplaceReadyNotificationStoreSchema.Type =
  {
    notificationState: 'completed',
  }

export const {
  atom: marketplaceReadyNotificationStore,
  setAndSaveImmediatelyAtom:
    setMarketplaceReadyNotificationStoreImmediatelyAtom,
} = atomWithParsedMmkvStorageWithImmediateSaveOption(
  'marketplaceReadyNotification',
  defaultMarketplaceReadyNotificationStoreValue,
  MarketplaceReadyNotificationStoreSchema
)

export const beginMarketplaceReadyNotificationFlowActionAtom = atom(
  null,
  (_, set) => {
    set(setMarketplaceReadyNotificationStoreImmediatelyAtom, {
      notificationState: 'waitingForFirstOffer',
    })
  }
)

export const markMarketplaceReadyNotificationFlowAsCompletedActionAtom = atom(
  null,
  (_, set) => {
    set(
      setMarketplaceReadyNotificationStoreImmediatelyAtom,
      defaultMarketplaceReadyNotificationStoreValue
    )
  }
)

export const markMarketplaceReadyNotificationFlowAsCompletedIfOffersAreVisibleActionAtom =
  atom(null, (get, set) => {
    if (
      get(marketplaceReadyNotificationStore).notificationState ===
        'completed' ||
      !Array.isNonEmptyReadonlyArray(
        get(filteredOffersIncludingLocationFilterAtom)
      )
    )
      return

    set(markMarketplaceReadyNotificationFlowAsCompletedActionAtom)
  })
