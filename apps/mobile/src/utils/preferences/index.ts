import {atomWithParsedMmkvStorage} from '../atomUtils/atomWithParsedMmkvStorage'
import {Preferences} from './domain'
import {focusAtom} from 'jotai-optics'

export const preferencesAtom = atomWithParsedMmkvStorage(
  'preferences',
  {
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
    showTextDebugButton: false,
    isDeveloper: false,
  },
  Preferences
)

export const notificationPreferencesAtom = focusAtom(preferencesAtom, (o) =>
  o.prop('notificationPreferences')
)

export const friendLevelBannerPreferenceAtom = focusAtom(preferencesAtom, (p) =>
  p.prop('showFriendLevelBanner')
)

export const showTextDebugButtonAtom = focusAtom(preferencesAtom, (p) =>
  p.prop('showTextDebugButton')
)

export const isDeveloperAtom = focusAtom(preferencesAtom, (p) =>
  p.prop('isDeveloper')
)
