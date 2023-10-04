import {z} from 'zod'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

export const ChatNotificationDataBrand = z.object({
  inbox: PublicKeyPemBase64,
  sender: PublicKeyPemBase64,
})
export type ChatNotificationDataBrand = z.TypeOf<
  typeof ChatNotificationDataBrand
>
