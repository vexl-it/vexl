import {z} from 'zod'

export const Preferences = z.object({
  showDebugNotifications: z.boolean().default(false),
  disableOfferRerequestLimit: z.boolean().default(false),
  allowSendingImages: z.boolean().default(false),
})

export type Preferences = z.infer<typeof Preferences>
