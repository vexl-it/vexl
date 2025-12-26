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
import {Either, Schema} from 'effect/index'
import reportError from '../../utils/reportError'

export const ChatDataForTradeChecklist = Schema.Struct({
  chatId: ChatId,
  inboxKey: PublicKeyPemBase64,
})
export type ChatDataForTradeChecklist = typeof ChatDataForTradeChecklist.Type

export const withFallback = <A, I, R>(
  self: Schema.Schema<A, I, R>,
  fallback: NoInfer<A>
): Schema.Schema<A, I, R> => {
  return self.annotations({
    decodingFallback: (issue) => {
      reportError(
        'error',
        new Error('Trade checklist in state formatting error caught'),
        {
          err: issue,
        }
      )
      return Either.right(fallback)
    },
  })
}

export const TradeChecklistInState = Schema.Struct({
  dateAndTime: withFallback(
    Schema.Struct({
      sent: Schema.optionalWith(DateTimeChatMessage, {nullable: true}),
      received: Schema.optionalWith(DateTimeChatMessage, {nullable: true}),
    }),
    {}
  ),
  location: withFallback(
    Schema.Struct({
      sent: Schema.optionalWith(MeetingLocationChatMessage, {nullable: true}),
      received: Schema.optionalWith(MeetingLocationChatMessage, {
        nullable: true,
      }),
    }),
    {}
  ),
  amount: withFallback(
    Schema.Struct({
      sent: Schema.optionalWith(AmountChatMessage, {nullable: true}),
      received: Schema.optionalWith(AmountChatMessage, {nullable: true}),
    }),
    {}
  ),
  network: withFallback(
    Schema.Struct({
      sent: Schema.optionalWith(NetworkChatMessage, {nullable: true}),
      received: Schema.optionalWith(NetworkChatMessage, {nullable: true}),
    }),
    {}
  ),
  identity: withFallback(
    Schema.Struct({
      sent: Schema.optionalWith(IdentityRevealChatMessage, {nullable: true}),
      received: Schema.optionalWith(IdentityRevealChatMessage, {
        nullable: true,
      }),
    }),
    {}
  ),
  contact: withFallback(
    Schema.Struct({
      sent: Schema.optionalWith(ContactRevealChatMessage, {nullable: true}),
      received: Schema.optionalWith(ContactRevealChatMessage, {nullable: true}),
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
