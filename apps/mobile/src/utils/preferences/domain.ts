import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {GoldenAvatarType} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'
import {FiatOrSats} from '../../state/marketplace/domain'
import {currencies} from '../localization/currency'

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
  offerFeedbackEnabled: Schema.optionalWith(Schema.Boolean, {
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
})

export type Preferences = typeof Preferences.Type
