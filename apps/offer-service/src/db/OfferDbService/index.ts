import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'

import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {
  type OfferParts,
  type OfferPartsWithOfferForUserUpdateCounter,
  type PrivatePartRecord,
  type PublicPartId,
  type PublicPartRecord,
} from './domain'
import {
  createDeleteAllPrivatePartsForAdminId,
  type DeleteAllPrivatePartsForAdminIdRequest,
} from './queries/createDeleteAllPrivatePartsForAdminId'
import {createDeleteOfferReportedRecordByReportedAtBefore} from './queries/createDeleteOfferReportedRecordByReportedAtBefore'
import {
  createDeletePrivatePart,
  type DeletePrivatePartRequest,
} from './queries/createDeletePrivatePart'
import {
  createDeletePublicPart,
  type DeletePublicPartRequest,
} from './queries/createDeletePublicPart'
import {
  createInsertOfferPrivatePart,
  type InsertOfferPrivatePartRequest,
} from './queries/createInsertOfferPrivatePart'
import {
  createInsertOfferReportedRecord,
  type InsertOfferReportedRecordParams,
} from './queries/createInsertOfferReportedRecord'
import {
  createInsertPublicPart,
  type InsertPublicPartRequest,
} from './queries/createInsertPublicPart'
import {createQueryAllPrivateRecordsByPublicRecordId} from './queries/createQueryAllPrivateRecordsByPublicRecordId'
import {createQueryNumberOfReportsForUser} from './queries/createQueryNumberOfReportsForUser'
import {
  createQueryOfferByPublicKeyAndOfferId,
  type QueryOfferByPublicKeyAndOfferIdRequest,
} from './queries/createQueryOfferByPublicKeyAndOfferId'
import {
  createQueryOfferIdsForUser,
  type QueryOfferIdsForUserRequest,
} from './queries/createQueryOfferIdsForUser'
import {
  createQueryOffersForUserPaginated,
  type QueryOffersPaginatedRequest,
} from './queries/createQueryOffersForUserPaginated'
import {
  createQueryPublicPartByAdminId,
  type QueryOfferByAdminIdRequest,
} from './queries/createQueryPublicPartByAdminId'
import {
  createUpdateOfferPublicPayload,
  type UpdateOfferPublicPayloadRequest,
} from './queries/createUpdateOfferPublicPayload'
import {
  createUpdateRefreshOffer,
  type UpdateRefreshOfferRequest,
} from './queries/createUpdateRefreshOffer'
import {
  createUpdateReportOffer,
  type UpdateReportOfferRequest,
} from './queries/createUpdateReportOffer'

export interface OfferDbOperations {
  queryOffersForUserPaginated: (
    args: QueryOffersPaginatedRequest
  ) => Effect.Effect<
    readonly OfferPartsWithOfferForUserUpdateCounter[],
    UnexpectedServerError
  >

  queryOfferByPublicKeyAndOfferId: (
    args: QueryOfferByPublicKeyAndOfferIdRequest
  ) => Effect.Effect<Option.Option<OfferParts>, UnexpectedServerError>

  queryOffersIds: (
    args: QueryOfferIdsForUserRequest
  ) => Effect.Effect<readonly OfferId[], UnexpectedServerError>

  queryNumberOfReportsForUser: (
    args: PublicKeyPemBase64
  ) => Effect.Effect<number, UnexpectedServerError>

  queryPublicPartByAdminId: (
    args: QueryOfferByAdminIdRequest
  ) => Effect.Effect<Option.Option<PublicPartRecord>, UnexpectedServerError>

  queryAllPrivateRecordsByPublicRecordId: (
    id: PublicPartId
  ) => Effect.Effect<readonly PrivatePartRecord[], UnexpectedServerError>

  insertPublicPart: (
    args: InsertPublicPartRequest
  ) => Effect.Effect<PublicPartRecord, UnexpectedServerError>

  insertOfferPrivatePart: (
    args: InsertOfferPrivatePartRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  insertOfferReportedRecord: (
    args: InsertOfferReportedRecordParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateRefreshOffer: (
    args: UpdateRefreshOfferRequest
  ) => Effect.Effect<OfferId, UnexpectedServerError>

  updateReportOffer: (
    args: UpdateReportOfferRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  updateOfferPublicPayload: (
    args: UpdateOfferPublicPayloadRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  deletePublicPart: (
    args: DeletePublicPartRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  deletePrivatePart: (
    args: DeletePrivatePartRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteAllPrivatePartsForAdminId: (
    args: DeleteAllPrivatePartsForAdminIdRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  deleteOfferReportedRecordByReportedAtBefore: (
    args: number
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class OfferDbService extends Context.Service<
  OfferDbService,
  OfferDbOperations
>()('OfferDbService') {
  static readonly Live = Layer.effect(
    OfferDbService,
    Effect.gen(function* () {
      return {
        queryOffersForUserPaginated: yield* createQueryOffersForUserPaginated,
        queryOfferByPublicKeyAndOfferId:
          yield* createQueryOfferByPublicKeyAndOfferId,
        queryOffersIds: yield* createQueryOfferIdsForUser,
        queryNumberOfReportsForUser: yield* createQueryNumberOfReportsForUser,
        queryPublicPartByAdminId: yield* createQueryPublicPartByAdminId,
        queryAllPrivateRecordsByPublicRecordId:
          yield* createQueryAllPrivateRecordsByPublicRecordId,
        insertPublicPart: yield* createInsertPublicPart,
        insertOfferPrivatePart: yield* createInsertOfferPrivatePart,
        insertOfferReportedRecord: yield* createInsertOfferReportedRecord,
        updateReportOffer: yield* createUpdateReportOffer,
        updateRefreshOffer: yield* createUpdateRefreshOffer,
        updateOfferPublicPayload: yield* createUpdateOfferPublicPayload,
        deletePublicPart: yield* createDeletePublicPart,
        deletePrivatePart: yield* createDeletePrivatePart,
        deleteAllPrivatePartsForAdminId:
          yield* createDeleteAllPrivatePartsForAdminId,
        deleteOfferReportedRecordByReportedAtBefore:
          yield* createDeleteOfferReportedRecordByReportedAtBefore,
      }
    })
  )
}
