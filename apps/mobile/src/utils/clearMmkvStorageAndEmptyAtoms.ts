import {type OneOfferInState} from '@vexl-next/domain/dist/general/offers'
import {MINIMAL_DATE} from '@vexl-next/domain/dist/utility/IsoDatetimeString.brand'
import {UnixMilliseconds} from '@vexl-next/domain/dist/utility/UnixMilliseconds.brand'
import {getDefaultStore} from 'jotai'
import {previousSearchesAtom} from '../components/SearchOffersScreen/atoms/previousSearchesAtom'
import {messagingStateAtomStorageAtom} from '../state/chat/atoms/messagingStateAtom'
import connectionStateAtom from '../state/connections/atom/connectionStateAtom'
import offerToConnectionsAtom from '../state/connections/atom/offerToConnectionsAtom'
import {
  combinedContactsAfterLastSubmitStorageAtom,
  importedContactsStorageAtom,
} from '../state/contacts'
import {
  feedbacksForClosedChatsStorageAtom,
  newOfferFeedbackDoneStorageAtom,
} from '../state/feedback/atoms'
import {offersStateAtom} from '../state/marketplace/atom'
import {postLoginFinishedStorageAtom} from '../state/postLoginOnboarding'
import {selectedCurrencyStorageAtom} from '../state/selectedCurrency'
import {storage} from './fpMmkv'
import {preferencesAtom} from './preferences'

export default function clearMmkvStorageAndEmptyAtoms(): void {
  // TODO:#110 find a better way how to clear the state

  getDefaultStore().set(messagingStateAtomStorageAtom, {messagingState: []})
  getDefaultStore().set(connectionStateAtom, {
    lastUpdate: UnixMilliseconds.parse(0),
    firstLevel: [],
    secondLevel: [],
    commonFriends: {commonContacts: []},
  })
  getDefaultStore().set(offerToConnectionsAtom, {
    offerToConnections: [],
  })
  getDefaultStore().set(newOfferFeedbackDoneStorageAtom, {
    newOfferFeedbackDone: false,
  })
  getDefaultStore().set(importedContactsStorageAtom, {
    importedContacts: [],
  })
  getDefaultStore().set(combinedContactsAfterLastSubmitStorageAtom, {
    combinedContactsAfterLastSubmit: null,
  })
  getDefaultStore().set(offersStateAtom, {
    lastUpdatedAt: MINIMAL_DATE,
    offers: [] as OneOfferInState[],
  })
  getDefaultStore().set(postLoginFinishedStorageAtom, {
    postLoginFinished: false,
  })
  getDefaultStore().set(selectedCurrencyStorageAtom, {
    currency: 'USD',
  })
  getDefaultStore().set(preferencesAtom, {
    showDebugNotifications: false,
    disableOfferRerequestLimit: false,
    allowSendingImages: false,
    notificationPreferences: {
      marketing: true,
      chat: true,
      inactivityWarnings: true,
      marketplace: true,
      newOfferInMarketplace: true,
      newPhoneContacts: true,
      offer: true,
    },
    enableNewOffersNotificationDevMode: false,
    showFriendLevelBanner: true,
    tradeChecklistEnabled: false,
    offerFeedbackEnabled: false,
  })

  getDefaultStore().set(previousSearchesAtom, [])

  getDefaultStore().set(feedbacksForClosedChatsStorageAtom, {feedbacks: {}})

  storage._storage.clearAll()
}
