import {focusAtom} from 'jotai-optics'
import {atomWithParsedMmkvStorage} from '../atomUtils/atomWithParsedMmkvStorage'
import {Preferences} from './domain'

export const preferencesAtom = atomWithParsedMmkvStorage(
  'preferences',
  {
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
    showOfferDetail: false,
    enableNewOffersNotificationDevMode: false,
    showFriendLevelBanner: true,
    offerFeedbackEnabled: false,
    showTextDebugButton: false,
    disableScreenshots: false,
    isDeveloper: false,
    marketplaceFiatOrSatsCurrency: 'FIAT',
    showVexlSearchForCooSuggestion: true,
    showSuggestReencryptOffersMissingOnServer: false,
    lastDisplayOfDonationPromptTimestamp: undefined,
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

export const currentAppLanguageAtom = focusAtom(preferencesAtom, (o) =>
  o.prop('appLanguage')
)

export const marketplaceFiatOrSatsCurrencyAtom = focusAtom(
  preferencesAtom,
  (o) => o.prop('marketplaceFiatOrSatsCurrency')
)

export const goldenAvatarTypeAtom = focusAtom(preferencesAtom, (o) =>
  o.prop('goldenAvatarType')
)

export const showVexlSearchForCooSuggestionAtom = focusAtom(
  preferencesAtom,
  (o) => o.prop('showVexlSearchForCooSuggestion')
)

export const showSuggestReencryptOffersMissingOnServerAtom = focusAtom(
  preferencesAtom,
  (o) => o.prop('showSuggestReencryptOffersMissingOnServer')
)

export const lastDisplayOfDonationPromptTimestampAtom = focusAtom(
  preferencesAtom,
  (o) => o.prop('lastDisplayOfDonationPromptTimestamp')
)
