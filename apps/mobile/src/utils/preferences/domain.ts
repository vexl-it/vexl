import {
  GoldenAvatarType,
  GoldenAvatarTypeE,
} from '@vexl-next/domain/src/general/offers'
import {Schema} from 'effect'
import {z} from 'zod'
import {FiatOrSats, FiatOrSatsE} from '../../state/marketplace/domain'

const NotificationPreferences = z
  .object({
    offer: z.boolean(),
    chat: z.boolean(),
    marketplace: z.boolean(),
    newOfferInMarketplace: z.boolean(),
    newPhoneContacts: z.boolean(),
    inactivityWarnings: z.boolean(),
    marketing: z.boolean(),
  })
  .readonly()

const NotificationPreferencesE = Schema.Struct({
  offer: Schema.Boolean,
  chat: Schema.Boolean,
  marketplace: Schema.Boolean,
  newOfferInMarketplace: Schema.Boolean,
  newPhoneContacts: Schema.Boolean,
  inactivityWarnings: Schema.Boolean,
  marketing: Schema.Boolean,
})

export const Preferences = z
  .object({
    disableOfferRerequestLimit: z.boolean().default(false),
    allowSendingImages: z.boolean().default(false),
    notificationPreferences: NotificationPreferences,
    enableNewOffersNotificationDevMode: z.boolean().default(false),
    showFriendLevelBanner: z.boolean().default(true),
    offerFeedbackEnabled: z.boolean().default(false),
    showTextDebugButton: z.boolean().default(false),
    disableScreenshots: z.boolean().default(false),
    isDeveloper: z.boolean().default(false),
    appLanguage: z.string().optional(),
    showOfferDetail: z.boolean().optional().default(false),
    marketplaceFiatOrSatsCurrency: FiatOrSats.default('FIAT'),
    goldenAvatarType: GoldenAvatarType.optional(),
  })
  .readonly()

export const PreferencesE = Schema.Struct({
  disableOfferRerequestLimit: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  allowSendingImages: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  notificationPreferences: NotificationPreferencesE,
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
  marketplaceFiatOrSatsCurrency: Schema.optionalWith(FiatOrSatsE, {
    default: () => 'FIAT',
  }),
  goldenAvatarType: Schema.optional(GoldenAvatarTypeE),
})

export type Preferences = typeof PreferencesE.Type
