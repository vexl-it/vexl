import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {z} from 'zod'
import {ChatNotificationType} from './notificationTypes'

export const ChatNotificationData = z.object({
  inbox: PublicKeyPemBase64,
  type: z.union([ChatNotificationType, z.literal('UNKNOWN')]).catch('UNKNOWN'),
  sender: PublicKeyPemBase64,
  preview: z.string().optional(),
})
export type ChatNotificationData = z.TypeOf<typeof ChatNotificationData>
