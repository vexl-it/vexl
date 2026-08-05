import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {Schema} from 'effect'

export const BlockedChatSender = Schema.Struct({
  inboxPublicKey: PublicKeyPemBase64,
  blockedSenderPublicKey: PublicKeyPemBase64,
}).pipe(Schema.brand('BlockedChatSender'))
export type BlockedChatSender = typeof BlockedChatSender.Type

export const BlockedChatSendersState = Schema.Struct({
  blockedSenders: Schema.Array(BlockedChatSender).pipe(Schema.mutable),
})
