import {z} from 'zod'
import {FiatOrSats} from '../../state/marketplace/domain'

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
    marketplaceFiatOrSatsCurrency: FiatOrSats.default('FIAT'),
  })
  .readonly()

export type Preferences = z.infer<typeof Preferences>
