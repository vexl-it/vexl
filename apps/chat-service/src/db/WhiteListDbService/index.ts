import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type WhitelistRecord, type WhitelistRecordId} from './domain'
import {createDeleteWhitelistRecord} from './queries/createDeleteWhitelistRecord'
import {
  createDeleteWhitelistRecordBySenderAndReceiver,
  type DeleteWhitelistRecordBySenderAndReceiverParams,
} from './queries/createDeleteWhitelistRecordBySenderAndReceiver'
import {
  createDeleteWhitelistRecordsWhereInboxIsReceiverOrSender,
  type DeleteWhitelistRecordsWhereInboxIsReceiverOrSenderParams,
} from './queries/createDeleteWhitelistRecordsWhereInboxIsReceiverOrSender'
import {
  createFindWhitelistRecordBySenderAndReceiver,
  type FindWhitelistRecordBySenderAndReceiverParams,
} from './queries/createFindWhitelistRecordBySenderAndReceiver'
import {
  createInsertWhitelistRecord,
  type InsertWhitelistRecordParams,
} from './queries/createInsertWhitelistRecord'
import {
  createUpdateWhitelistRecordState,
  type UpdateWhitelistRecordParams,
} from './queries/createUpdateWhitelistRecordState'

export interface WhitelistDbOperations {
  deleteWhitelistRecord: (
    params: WhitelistRecordId
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteWhitelistRecordBySenderAndReceiver: (
    params: DeleteWhitelistRecordBySenderAndReceiverParams
  ) => Effect.Effect<void, UnexpectedServerError>

  findWhitelistRecordBySenderAndReceiver: (
    params: FindWhitelistRecordBySenderAndReceiverParams
  ) => Effect.Effect<Option.Option<WhitelistRecord>, UnexpectedServerError>

  deleteWhitelistRecordsWhereInboxIsReceiverOrSender: (
    params: DeleteWhitelistRecordsWhereInboxIsReceiverOrSenderParams
  ) => Effect.Effect<void, UnexpectedServerError>

  insertWhitelistRecord: (
    params: InsertWhitelistRecordParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateWhitelistRecordState: (
    params: UpdateWhitelistRecordParams
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class WhitelistDbService extends Context.Tag('WhitelistDbService')<
  WhitelistDbService,
  WhitelistDbOperations
>() {
  static readonly Live = Layer.effect(
    WhitelistDbService,
    Effect.gen(function* (_) {
      const deleteWhitelistRecord = yield* _(createDeleteWhitelistRecord)
      const deleteWhitelistRecordBySenderAndReceiver = yield* _(
        createDeleteWhitelistRecordBySenderAndReceiver
      )
      const findWhitelistRecordBySenderAndReceiver = yield* _(
        createFindWhitelistRecordBySenderAndReceiver
      )
      const insertWhitelistRecord = yield* _(createInsertWhitelistRecord)
      const updateWhitelistRecordState = yield* _(
        createUpdateWhitelistRecordState
      )

      const deleteWhitelistRecordsWhereInboxIsReceiverOrSender = yield* _(
        createDeleteWhitelistRecordsWhereInboxIsReceiverOrSender
      )

      return {
        deleteWhitelistRecord,
        findWhitelistRecordBySenderAndReceiver,
        insertWhitelistRecord,
        updateWhitelistRecordState,
        deleteWhitelistRecordBySenderAndReceiver,
        deleteWhitelistRecordsWhereInboxIsReceiverOrSender,
      }
    })
  )
}
