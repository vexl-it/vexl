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
import {Schema} from 'effect/index'

export const ChatDataForTradeChecklist = Schema.Struct({
  chatId: ChatId,
  inboxKey: PublicKeyPemBase64,
})
export type ChatDataForTradeChecklist = typeof ChatDataForTradeChecklist.Type

export const TradeChecklistInState = Schema.Struct({
  dateAndTime: Schema.Struct({
    sent: Schema.optionalWith(DateTimeChatMessage, {nullable: true}),
    received: Schema.optionalWith(DateTimeChatMessage, {nullable: true}),
  }),
  location: Schema.Struct({
    sent: Schema.optionalWith(MeetingLocationChatMessage, {nullable: true}),
    received: Schema.optionalWith(MeetingLocationChatMessage, {nullable: true}),
  }),
  amount: Schema.Struct({
    sent: Schema.optionalWith(AmountChatMessage, {nullable: true}),
    received: Schema.optionalWith(AmountChatMessage, {nullable: true}),
  }),
  network: Schema.Struct({
    sent: Schema.optionalWith(NetworkChatMessage, {nullable: true}),
    received: Schema.optionalWith(NetworkChatMessage, {nullable: true}),
  }),
  identity: Schema.Struct({
    sent: Schema.optionalWith(IdentityRevealChatMessage, {nullable: true}),
    received: Schema.optionalWith(IdentityRevealChatMessage, {nullable: true}),
  }),
  contact: Schema.Struct({
    sent: Schema.optionalWith(ContactRevealChatMessage, {nullable: true}),
    received: Schema.optionalWith(ContactRevealChatMessage, {nullable: true}),
  }),
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
