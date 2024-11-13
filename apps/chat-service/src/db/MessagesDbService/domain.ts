import {MessageTypeE} from '@vexl-next/domain/src/general/messaging'
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
    message: Schema.String,
    senderPublicKey: PublicKeyEncrypted, // TODO is this needed?
    pulled: Schema.Boolean,
    type: MessageTypeE, // TODO brand
    inboxId: InboxRecordId,
    expiresAt: Schema.DateFromSelf,
  }
) {}
