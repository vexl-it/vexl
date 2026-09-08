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
import {optionalNullable} from '@vexl-next/generic-utils/src/effect-helpers/optionalNullable'
import {withDecodingFallback} from '@vexl-next/generic-utils/src/effect-helpers/withDecodingFallback'
import {Schema} from 'effect'
import reportError from '../../utils/reportError'

export const ChatDataForTradeChecklist = Schema.Struct({
  chatId: ChatId,
  inboxKey: PublicKeyPemBase64,
})
export type ChatDataForTradeChecklist = typeof ChatDataForTradeChecklist.Type

export const withFallback = <S extends Schema.Constraint>(
  self: S,
  fallback: NoInfer<S['Type']>
): ReturnType<typeof withDecodingFallback<S>> =>
  withDecodingFallback(self, (issue) => {
    reportError(
      'error',
      new Error('Trade checklist in state formatting error caught'),
      {err: issue}
    )
    return fallback
  })

export const TradeChecklistInState = Schema.Struct({
  dateAndTime: withFallback(
    Schema.Struct({
      sent: optionalNullable(DateTimeChatMessage),
      received: optionalNullable(DateTimeChatMessage),
    }),
    {}
  ),
  location: withFallback(
    Schema.Struct({
      sent: optionalNullable(MeetingLocationChatMessage),
      received: optionalNullable(MeetingLocationChatMessage),
    }),
    {}
  ),
  amount: withFallback(
    Schema.Struct({
      sent: optionalNullable(AmountChatMessage),
      received: optionalNullable(AmountChatMessage),
    }),
    {}
  ),
  network: withFallback(
    Schema.Struct({
      sent: optionalNullable(NetworkChatMessage),
      received: optionalNullable(NetworkChatMessage),
    }),
    {}
  ),
  identity: withFallback(
    Schema.Struct({
      sent: optionalNullable(IdentityRevealChatMessage),
      received: optionalNullable(IdentityRevealChatMessage),
    }),
    {}
  ),
  contact: withFallback(
    Schema.Struct({
      sent: optionalNullable(ContactRevealChatMessage),
      received: optionalNullable(ContactRevealChatMessage),
    }),
    {}
  ),
})
export type TradeChecklistInState = typeof TradeChecklistInState.Type

export function createEmptyTradeChecklistInState(): TradeChecklistInState {
  return {
    dateAndTime: {},
    location: {},
    amount: {},
    network: {},
    identity: {},
    contact: {},
  }
}
