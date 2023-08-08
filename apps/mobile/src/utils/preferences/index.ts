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
  },
  Preferences
)

export const notificationPreferencesAtom = focusAtom(preferencesAtom, (o) =>
  o.prop('notificationPreferences')
)
