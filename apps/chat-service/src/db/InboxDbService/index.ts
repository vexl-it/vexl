import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type InboxRecord} from './domain'
import {createDeleteInboxByPublicKey} from './queries/createDeleteInboxByPublicKey'
import {createFindInboxByPublicKey} from './queries/createFindInboxByPublicKey'
import {
  createInsertInbox,
  type InsertInboxParams,
} from './queries/createInsertInbox'

export interface InboxDbOperations {
  deleteInboxByPublicKey: (
    args: PublicKeyPemBase64
  ) => Effect.Effect<void, UnexpectedServerError>

  findInboxByPublicKey: (
    args: PublicKeyPemBase64
  ) => Effect.Effect<Option.Option<InboxRecord>, UnexpectedServerError>

  insertInbox: (
    args: InsertInboxParams
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

      return {
        deleteInboxByPublicKey,
        findInboxByPublicKey,
        insertInbox,
      }
    })
  )
}
