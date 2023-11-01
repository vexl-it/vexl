import {z} from 'zod'
import {ChatId} from '@vexl-next/domain/dist/general/messaging'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'

export const ChatDataForTradeChecklist = z.object({
  chatId: ChatId,
  inboxKey: PublicKeyPemBase64,
})
export type ChatDataForTradeChecklist = z.TypeOf<
  typeof ChatDataForTradeChecklist
>
