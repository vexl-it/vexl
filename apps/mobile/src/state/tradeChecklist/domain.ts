import {z} from 'zod'
import {ChatId} from '@vexl-next/domain/dist/general/messaging'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {
  DateTimeChatMessage,
  NetworkChatMessage,
} from '@vexl-next/domain/dist/general/tradeChecklist'

export const ChatDataForTradeChecklist = z.object({
  chatId: ChatId,
  inboxKey: PublicKeyPemBase64,
})
export type ChatDataForTradeChecklist = z.TypeOf<
  typeof ChatDataForTradeChecklist
>

export const TradeChecklistInState = z.object({
  dateAndTime: z.object({
    sent: DateTimeChatMessage.optional(),
    received: DateTimeChatMessage.optional(),
  }),
  location: z.object({
    sent: z.object({}).optional(),
    received: z.object({}).optional(),
  }),
  amount: z.object({
    sent: z.object({}).optional(),
    received: z.object({}).optional(),
  }),
  network: z.object({
    sent: NetworkChatMessage.optional(),
    received: NetworkChatMessage.optional(),
  }),
  identity: z.object({
    sent: z.object({}).optional(),
    received: z.object({}).optional(),
  }),
})
export type TradeChecklistInState = z.TypeOf<typeof TradeChecklistInState>

export const createEmptyTradeChecklistInState = (): TradeChecklistInState => ({
  dateAndTime: {},
  location: {},
  amount: {},
  network: {},
  identity: {},
})
