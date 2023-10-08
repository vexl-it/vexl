import {z} from 'zod'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

export const ChatNotificationData = z.object({
  inbox: PublicKeyPemBase64,
  sender: PublicKeyPemBase64,
  preview: z.string().optional(),
})
export type ChatNotificationData = z.TypeOf<typeof ChatNotificationData>
