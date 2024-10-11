import {Schema} from '@effect/schema'
import {PublicKeyEncrypted} from '../domain'
import {InboxRecordId} from '../InboxDbService/domain'

export const MessageRecordId = Schema.BigInt.pipe(
  Schema.brand('MessageRecordId')
)
export type MessageRecordId = Schema.Schema.Type<typeof MessageRecordId>

export class MessageRecord extends Schema.Class<MessageRecord>('MessageRecord')(
  {
    id: MessageRecordId,
    message: Schema.String,
    senderPublicKey: PublicKeyEncrypted,
    pulled: Schema.Boolean,
    type: Schema.String, // TODO literal enum
    inboxId: InboxRecordId,
    // TODO deleteAfter - date that is randomly generated 6-15 days into the future
  }
) {}
