import {
  MessageCypher,
  MessageType,
} from '@vexl-next/domain/src/general/messaging'
import {Schema} from 'effect'
import {InboxRecordId} from '../InboxDbService/domain'
import {PublicKeyEncrypted} from '../domain'

export const MessageRecordId = Schema.BigInt.pipe(
  Schema.brand('MessageRecordId')
)
export type MessageRecordId = Schema.Schema.Type<typeof MessageRecordId>

export class MessageRecord extends Schema.Class<MessageRecord>('MessageRecord')(
  {
    id: MessageRecordId,
    message: MessageCypher,
    senderPublicKey: PublicKeyEncrypted, // TODO is this needed?
    pulled: Schema.Boolean,
    type: MessageType, // TODO brand
    inboxId: InboxRecordId,
    expiresAt: Schema.DateFromSelf,
  }
) {}
