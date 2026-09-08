import {CurrencyCode} from '@vexl-next/domain/src/general/currency.brand'
import {
  GoldenAvatarType,
  SpokenLanguage,
} from '@vexl-next/domain/src/general/offers'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect, Schema} from 'effect'
import {FiatOrSats} from '../../state/marketplace/domain'
import {getDeviceLanguage} from '../localization/appLanguage'
import {currencies} from '../localization/currency'
import getDefaultSpokenLanguage from '../localization/getDefaultSpokenLanguage'

export const AppThemeMode = Schema.Literals(['light', 'dark', 'system'])

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
  disableOfferRerequestLimit: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  allowSendingImages: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  notificationPreferences: NotificationPreferences,
  showOfferDetail: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  enableNewOffersNotificationDevMode: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  showFriendLevelBanner: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  showTextDebugButton: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  disableScreenshots: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  isDeveloper: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  appLanguage: Schema.optional(Schema.String),
  appThemeMode: AppThemeMode.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 'system' => 'system')),
    Schema.withConstructorDefault(Effect.sync((): 'system' => 'system'))
  ),
  marketplaceFiatOrSatsCurrency: FiatOrSats.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): 'FIAT' => 'FIAT')),
    Schema.withConstructorDefault(Effect.sync((): 'FIAT' => 'FIAT'))
  ),
  goldenAvatarType: Schema.optional(GoldenAvatarType),
  showVexlSearchForCooSuggestion: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  showSuggestReencryptOffersMissingOnServer: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  lastDisplayOfDonationPromptTimestamp: Schema.optional(UnixMilliseconds),
  showTosSummaryForAlreadyLoggedInUser: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  showCheckUpdatedPrivacyPolicySuggestion: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  defaultCurrency: CurrencyCode.pipe(
    Schema.withDecodingDefaultType(Effect.sync(() => currencies.USD.code)),
    Schema.withConstructorDefault(Effect.sync(() => currencies.USD.code))
  ),
  runTasksInParallel: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  sendReadReceipts: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  showVerifiedContacts: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  showCreateOfferInMarketplaceSuggestion: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  showImportContactsInMarketplaceSuggestion: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  showEnableNotificationsInMarketplaceSuggestion: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  showEnableBackgroundRefreshInMarketplaceSuggestion: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  showMarketplaceIntroDialog: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  showNotesBoardIntroSheet: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): true => true)),
    Schema.withConstructorDefault(Effect.sync((): true => true))
  ),
  notesBoardEnabled: Schema.Boolean.pipe(
    Schema.withDecodingDefaultType(Effect.sync((): false => false)),
    Schema.withConstructorDefault(Effect.sync((): false => false))
  ),
  lastUsedOfferSpokenLanguages: Schema.Array(SpokenLanguage).pipe(
    Schema.withDecodingDefaultType(
      Effect.sync(() => getDefaultSpokenLanguage(getDeviceLanguage()))
    ),
    Schema.withConstructorDefault(
      Effect.sync(() => getDefaultSpokenLanguage(getDeviceLanguage()))
    )
  ),
})

export type Preferences = typeof Preferences.Type
