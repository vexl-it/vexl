import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {ChatId} from '@vexl-next/domain/src/general/messaging'
import {
  AmountChatMessage,
  ContactRevealChatMessage,
  DateTimeChatMessage,
  IdentityRevealChatMessage,
  MeetingLocationChatMessage,
  NetworkChatMessage,
} from '@vexl-next/domain/src/general/tradeChecklist'
import {z} from 'zod'
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
  reportError(
    'error',
    new Error('Trade checklist in state formatting error caught'),
    {
      err,
    }
  )
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
      sent: MeetingLocationChatMessage.optional(),
      received: MeetingLocationChatMessage.optional(),
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
