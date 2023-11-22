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
  showDebugNotifications: z.boolean().default(false),
  disableOfferRerequestLimit: z.boolean().default(false),
  allowSendingImages: z.boolean().default(false),
  notificationPreferences: NotificationPreferences,
  enableNewOffersNotificationDevMode: z.boolean().default(false),
  showFriendLevelBanner: z.boolean().default(true),
  tradeChecklistEnabled: z.boolean().default(false),
  offerFeedbackEnabled: z.boolean().default(false),
  showTextDebugButton: z.boolean().default(false),
})

export type Preferences = z.infer<typeof Preferences>
