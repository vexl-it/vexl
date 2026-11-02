import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type PublicKeyHashed} from '../domain'
import {type InboxRecord} from './domain'
import {createDeleteInboxByPublicKey} from './queries/createDeleteInboxByPublicKey'
import {createFindInboxByPublicKey} from './queries/createFindInboxByPublicKey'
import {
  createInsertInbox,
  type InsertInboxParams,
} from './queries/createInsertInbox'
import {
  createUpdateInboxMetadata,
  type UpdateInboxMetadataParams,
} from './queries/createUpdateInboxMetadata'

export interface InboxDbOperations {
  deleteInboxByPublicKey: (
    args: PublicKeyHashed
  ) => Effect.Effect<void, UnexpectedServerError>

  findInboxByPublicKey: (
    args: PublicKeyHashed
  ) => Effect.Effect<Option.Option<InboxRecord>, UnexpectedServerError>

  insertInbox: (
    args: InsertInboxParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateInboxMetadata: (
    args: UpdateInboxMetadataParams
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class InboxDbService extends Context.Tag('InboxDbService')<
  InboxDbService,
  InboxDbOperations
>() {
  static readonly Live = Layer.effect(
    InboxDbService,
    Effect.gen(function* (_) {
      const deleteInboxByPublicKey = yield* _(createDeleteInboxByPublicKey)
      const findInboxByPublicKey = yield* _(createFindInboxByPublicKey)
      const insertInbox = yield* _(createInsertInbox)
      const updateInboxMetadata = yield* _(createUpdateInboxMetadata)

      return {
        deleteInboxByPublicKey,
        findInboxByPublicKey,
        insertInbox,
        updateInboxMetadata,
      }
    })
  )
}
