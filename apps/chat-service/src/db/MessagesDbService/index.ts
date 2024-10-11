import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer} from 'effect'
import {type InboxRecordId} from '../InboxDbService/domain'
import {type MessageRecord, type MessageRecordId} from './domain'
import {createDeleteAllMessagesByInboxId} from './query/createDeleteAllMessagesByInboxId'
import {createDeletePulledMessagesMessagesByInboxId} from './query/createDeletePulledMessagesByInboxId'
import {createFindMessagesByInboxId} from './query/createFindMessagesByInboxId'
import {createUpdateMessageAsPulledByInboxId} from './query/createUpdateMessageAsPulledByInboxId'

export interface MessagesDbOperations {
  deleteAllMessagesByInboxId: (
    args: InboxRecordId
  ) => Effect.Effect<void, UnexpectedServerError>

  deletePulledMessagesByInboxId: (
    args: InboxRecordId
  ) => Effect.Effect<void, UnexpectedServerError>

  findMessagesByInboxId: (
    args: InboxRecordId
  ) => Effect.Effect<readonly MessageRecord[], UnexpectedServerError>

  updateMessageAsPulledByInboxRecord: (
    args: MessageRecordId
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class MessagesDbService extends Context.Tag('MessagesDbService')<
  MessagesDbService,
  MessagesDbOperations
>() {
  static readonly Live = Layer.effect(
    MessagesDbService,
    Effect.gen(function* (_) {
      const deleteAllMessagesByInboxId = yield* _(
        createDeleteAllMessagesByInboxId
      )
      const deletePulledMessagesByInboxId = yield* _(
        createDeletePulledMessagesMessagesByInboxId
      )
      const findMessagesByInboxId = yield* _(createFindMessagesByInboxId)
      const updateMessageAsPulledByInboxRecord = yield* _(
        createUpdateMessageAsPulledByInboxId
      )

      return {
        deleteAllMessagesByInboxId,
        deletePulledMessagesByInboxId,
        findMessagesByInboxId,
        updateMessageAsPulledByInboxRecord,
      }
    })
  )
}
