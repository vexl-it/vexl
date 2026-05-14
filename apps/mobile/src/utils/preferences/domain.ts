import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  GoldenAvatarType,
  SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {FiatOrSats} from '../../state/marketplace/domain'
import {currencies} from '../localization/currency'
import getDefaultSpokenLanguage from '../localization/getDefaultSpokenLanguage'

export const AppThemeMode = Schema.Literal('light', 'dark', 'system')

const NotificationPreferences = Schema.Struct({
  offer: Schema.Boolean,
  chat: Schema.Boolean,
  marketplace: Schema.Boolean,
  newOfferInMarketplace: Schema.Boolean,
  newPhoneContacts: Schema.Boolean,
  inactivityWarnings: Schema.Boolean,
  marketing: Schema.Boolean,
})

export const Preferences = Schema.Struct({
  disableOfferRerequestLimit: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  allowSendingImages: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  notificationPreferences: NotificationPreferences,
  showOfferDetail: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  enableNewOffersNotificationDevMode: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  showFriendLevelBanner: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  showTextDebugButton: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  disableScreenshots: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  isDeveloper: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  appLanguage: Schema.optional(Schema.String),
  appThemeMode: Schema.optionalWith(AppThemeMode, {
    default: () => 'system',
  }),
  marketplaceFiatOrSatsCurrency: Schema.optionalWith(FiatOrSats, {
    default: () => 'FIAT',
  }),
  goldenAvatarType: Schema.optional(GoldenAvatarType),
  showVexlSearchForCooSuggestion: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  showSuggestReencryptOffersMissingOnServer: Schema.optionalWith(
    Schema.Boolean,
    {
      default: () => false,
    }
  ),
  lastDisplayOfDonationPromptTimestamp: Schema.optional(UnixMilliseconds),
  showTosSummaryForAlreadyLoggedInUser: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  showCheckUpdatedPrivacyPolicySuggestion: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  defaultCurrency: Schema.optionalWith(CurrencyCode, {
    default: () => currencies.USD.code,
  }),
  runTasksInParallel: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  sendReadReceipts: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  showVerifiedContacts: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  showCreateOfferInMarketplaceSuggestion: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  showImportContactsInMarketplaceSuggestion: Schema.optionalWith(
    Schema.Boolean,
    {
      default: () => true,
    }
  ),
  showEnableNotificationsInMarketplaceSuggestion: Schema.optionalWith(
    Schema.Boolean,
    {
      default: () => true,
    }
  ),
  showMarketplaceIntroDialog: Schema.optionalWith(Schema.Boolean, {
    default: () => true,
  }),
  lastUsedOfferSpokenLanguages: Schema.optionalWith(
    Schema.Array(SpokenLanguage),
    {
      default: getDefaultSpokenLanguage,
    }
  ),
})

export type Preferences = typeof Preferences.Type
