import {fromDate} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type ServerMessageWithId} from '@vexl-next/rest-api/src/services/chat/contracts'
import {type MessageRecord} from '../../db/MessagesDbService/domain'

export function messageRecordToServerMessage({
  messageRecord,
  senderPublicKey,
}: {
  messageRecord: MessageRecord
  senderPublicKey: ServerMessageWithId['senderPublicKey']
}): ServerMessageWithId {
  return {
    id: Number(messageRecord.id),
    message: messageRecord.message,
    senderPublicKey,
    receivedByServerAt: messageRecord.receivedByServerAt
      ? fromDate(messageRecord.receivedByServerAt)
      : undefined,
  }
}
