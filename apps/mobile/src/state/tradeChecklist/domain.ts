import {z} from 'zod'
import {ChatId} from '@vexl-next/domain/dist/general/messaging'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import {
  AmountChatMessage,
  DateTimeChatMessage,
  NetworkChatMessage,
} from '@vexl-next/domain/dist/general/tradeChecklist'
import reportError from '../../utils/reportError'

export const ChatDataForTradeChecklist = z.object({
  chatId: ChatId,
  inboxKey: PublicKeyPemBase64,
})
export type ChatDataForTradeChecklist = z.TypeOf<
  typeof ChatDataForTradeChecklist
>

// eslint-disable-next-line @typescript-eslint/ban-types
function catchFormatError<T>(err: T): {} {
  reportError('error', 'Trade checklist in state formatting error caught', err)
  return {}
}

export const TradeChecklistInState = z.object({
  dateAndTime: z
    .object({
      sent: DateTimeChatMessage.optional(),
      received: DateTimeChatMessage.optional(),
    })
    .catch(catchFormatError),
  location: z
    .object({
      sent: z.object({}).optional(),
      received: z.object({}).optional(),
    })
    .catch(catchFormatError),
  amount: z
    .object({
      sent: AmountChatMessage.optional(),
      received: AmountChatMessage.optional(),
    })
    .catch(catchFormatError),
  network: z
    .object({
      sent: NetworkChatMessage.optional(),
      received: NetworkChatMessage.optional(),
    })
    .catch(catchFormatError),
  identity: z
    .object({
      sent: z.object({}).optional(),
      received: z.object({}).optional(),
    })
    .catch(catchFormatError),
})

export type TradeChecklistInState = z.TypeOf<typeof TradeChecklistInState>

export const createEmptyTradeChecklistInState = (): TradeChecklistInState => ({
  dateAndTime: {},
  location: {},
  amount: {},
  network: {},
  identity: {},
})
