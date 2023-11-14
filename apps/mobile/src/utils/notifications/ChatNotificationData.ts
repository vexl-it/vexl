import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {z} from 'zod'
import {ChatNotificationType} from './notificationTypes'

export const ChatNotificationData = z.object({
  inbox: PublicKeyPemBase64,
  type: ChatNotificationType,
  sender: PublicKeyPemBase64,
  preview: z.string().optional(),
})
export type ChatNotificationData = z.TypeOf<typeof ChatNotificationData>
