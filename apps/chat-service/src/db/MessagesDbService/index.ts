import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {type InboxRecordId} from '../InboxDbService/domain'
import {type MessageRecord, type MessageRecordId} from './domain'
import {createDeleteAllMessagesByInboxId} from './query/createDeleteAllMessagesByInboxId'
import {createDeleteExpiredMessages} from './query/createDeleteExpiredMessages'
import {
  createDeletePulledMessagesMessagesByInboxId,
  type DeletedPulledMessagesSummary,
} from './query/createDeletePulledMessagesByInboxId'
import {createFindMessagesByInboxId} from './query/createFindMessagesByInboxId'
import {
  createInsertMessageForInbox,
  type InsertMessageForInboxParams,
} from './query/createInsertMessageForInbox'
import {createUpdateMessageAsPulledByMessageRecord} from './query/createUpdateMessageAsPulledByMessageRecord'

export interface MessagesDbOperations {
  deleteAllMessagesByInboxId: (
    args: InboxRecordId
  ) => Effect.Effect<void, UnexpectedServerError>

  deletePulledMessagesByInboxId: (
    args: InboxRecordId
  ) => Effect.Effect<DeletedPulledMessagesSummary, UnexpectedServerError>

  deleteExpiredMessages: () => Effect.Effect<number, UnexpectedServerError>

  findMessagesByInboxId: (
    args: InboxRecordId
  ) => Effect.Effect<readonly MessageRecord[], UnexpectedServerError>

  insertMessageForInbox: (
    args: InsertMessageForInboxParams
  ) => Effect.Effect<MessageRecord, UnexpectedServerError>

  updateMessageAsPulledByMessageRecord: (
    args: MessageRecordId
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class MessagesDbService extends Context.Service<
  MessagesDbService,
  MessagesDbOperations
>()('MessagesDbService') {
  static readonly Live = Layer.effect(
    MessagesDbService,
    Effect.gen(function* () {
      const deleteAllMessagesByInboxId = yield* createDeleteAllMessagesByInboxId
      const deleteExpiredMessages = yield* createDeleteExpiredMessages
      const deletePulledMessagesByInboxId =
        yield* createDeletePulledMessagesMessagesByInboxId
      const findMessagesByInboxId = yield* createFindMessagesByInboxId
      const updateMessageAsPulledByMessageRecord =
        yield* createUpdateMessageAsPulledByMessageRecord

      const insertMessageForInbox = yield* createInsertMessageForInbox

      return {
        deleteAllMessagesByInboxId,
        deletePulledMessagesByInboxId,
        findMessagesByInboxId,
        updateMessageAsPulledByMessageRecord,
        insertMessageForInbox,
        deleteExpiredMessages,
      }
    })
  )
}
