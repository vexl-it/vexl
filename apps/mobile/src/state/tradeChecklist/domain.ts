import {z} from 'zod'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {
  AmountChatMessage,
  DateTimeChatMessage,
  IdentityRevealChatMessage,
  ContactRevealChatMessage,
  NetworkChatMessage,
} from '@vexl-next/domain/src/general/tradeChecklist'
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
    .default({})
    .catch(catchFormatError),
  location: z
    .object({
      sent: z.object({}).optional(),
      received: z.object({}).optional(),
    })
    .default({})
    .catch(catchFormatError),
  amount: z
    .object({
      sent: AmountChatMessage.optional(),
      received: AmountChatMessage.optional(),
    })
    .default({})
    .catch(catchFormatError),
  network: z
    .object({
      sent: NetworkChatMessage.optional(),
      received: NetworkChatMessage.optional(),
    })
    .default({})
    .catch(catchFormatError),
  identity: z
    .object({
      sent: IdentityRevealChatMessage.optional(),
      received: IdentityRevealChatMessage.optional(),
    })
    .default({})
    .catch(catchFormatError),
  contact: z
    .object({
      sent: ContactRevealChatMessage.optional(),
      received: ContactRevealChatMessage.optional(),
    })
    .default({})
    .catch(catchFormatError),
})

export type TradeChecklistInState = z.TypeOf<typeof TradeChecklistInState>

export const createEmptyTradeChecklistInState = (): TradeChecklistInState => ({
  dateAndTime: {},
  location: {},
  amount: {},
  network: {},
  identity: {},
  contact: {},
})
