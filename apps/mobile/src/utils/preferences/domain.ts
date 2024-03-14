import {z} from 'zod'

const NotificationPreferences = z.object({
  offer: z.boolean(),
  chat: z.boolean(),
  marketplace: z.boolean(),
  newOfferInMarketplace: z.boolean(),
  newPhoneContacts: z.boolean(),
  inactivityWarnings: z.boolean(),
  marketing: z.boolean(),
})

export const Preferences = z.object({
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
})

export type Preferences = z.infer<typeof Preferences>
