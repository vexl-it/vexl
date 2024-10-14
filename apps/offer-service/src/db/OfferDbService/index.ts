import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'

import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {
  type OfferParts,
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
  createInsertPublicPart,
  type InsertPublicPartRequest,
} from './queries/createInsertPublicPart'
import {createQueryAllPrivateRecordsByPublicRecordId} from './queries/createQueryAllPrivateRecordsByPublicRecordId'
import {createQueryNumberOfReportsForUser} from './queries/createQueryNumberOfReportsForUser'
import {
  createQueryOfferByPublicKeyAndOfferId,
  type QueryOfferByPublicKeyAndOfferIdRequest,
} from './queries/createQueryOfferByPublicKeyAndOfferId'
import {createQueryOfferIdsForUser} from './queries/createQueryOfferIdsForUser'
import {
  createQueryOffersForUser,
  type QueryOffersRequest,
} from './queries/createQueryOffersForUser'
import {
  createQueryPublicPartByAdminId,
  type QueryOfferByAdminIdRequest,
} from './queries/createQueryPublicPartByAdminId'
import {
  createUpdateOfferPublicPayload,
  type UpdateOfferPublicPayloadRequest,
} from './queries/createUpdateOfferPublicPayload'
import {
  createUpdateOfferPublicPayloadModifiedNow,
  type UpdateOfferPublicPayloadModifiedNowRequest,
} from './queries/createUpdateOfferPublicPayloadModifiedNow'
import {
  createUpdateRefreshOffer,
  type UpdateRefreshOfferRequest,
} from './queries/createUpdateRefreshOffer'
import {
  createUpdateReportOffer,
  type UpdateReportOfferRequest,
} from './queries/createUpdateReportOffer'

export interface OfferDbOperations {
  queryOffersForUser: (
    args: QueryOffersRequest
  ) => Effect.Effect<readonly OfferParts[], UnexpectedServerError>

  queryOfferByPublicKeyAndOfferId: (
    args: QueryOfferByPublicKeyAndOfferIdRequest
  ) => Effect.Effect<Option.Option<OfferParts>, UnexpectedServerError>

  queryOffersIds: (
    args: PublicKeyPemBase64
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

  updateRefreshOffer: (
    args: UpdateRefreshOfferRequest
  ) => Effect.Effect<OfferId, UnexpectedServerError>

  updateReportOffer: (
    args: UpdateReportOfferRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  updateOfferPublicPayload: (
    args: UpdateOfferPublicPayloadRequest
  ) => Effect.Effect<void, UnexpectedServerError>

  updateOfferPublicPartModifiedNow: (
    args: UpdateOfferPublicPayloadModifiedNowRequest
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

export class OfferDbService extends Context.Tag('OfferDbService')<
  OfferDbService,
  OfferDbOperations
>() {
  static readonly Live = Layer.effect(
    OfferDbService,
    Effect.gen(function* (_) {
      return {
        queryOffersForUser: yield* _(createQueryOffersForUser),
        queryOfferByPublicKeyAndOfferId: yield* _(
          createQueryOfferByPublicKeyAndOfferId
        ),
        queryOffersIds: yield* _(createQueryOfferIdsForUser),
        queryNumberOfReportsForUser: yield* _(
          createQueryNumberOfReportsForUser
        ),
        queryPublicPartByAdminId: yield* _(createQueryPublicPartByAdminId),
        queryAllPrivateRecordsByPublicRecordId: yield* _(
          createQueryAllPrivateRecordsByPublicRecordId
        ),
        insertPublicPart: yield* _(createInsertPublicPart),
        insertOfferPrivatePart: yield* _(createInsertOfferPrivatePart),
        updateReportOffer: yield* _(createUpdateReportOffer),
        updateRefreshOffer: yield* _(createUpdateRefreshOffer),
        updateOfferPublicPayload: yield* _(createUpdateOfferPublicPayload),
        updateOfferPublicPartModifiedNow: yield* _(
          createUpdateOfferPublicPayloadModifiedNow
        ),
        deletePublicPart: yield* _(createDeletePublicPart),
        deletePrivatePart: yield* _(createDeletePrivatePart),
        deleteAllPrivatePartsForAdminId: yield* _(
          createDeleteAllPrivatePartsForAdminId
        ),
        deleteOfferReportedRecordByReportedAtBefore: yield* _(
          createDeleteOfferReportedRecordByReportedAtBefore
        ),
      }
    })
  )
}
