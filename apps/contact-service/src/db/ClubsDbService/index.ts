import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type OfferId} from '@vexl-next/domain/src/general/offers'
import {Context, Effect, Layer, type Option} from 'effect'
import {type ClubDbRecord} from './domain'
import {
  createDeleteClub,
  type DeleteClubParams,
} from './queries/createDeleteClubs'
import {createFindClub, type FindClubParams} from './queries/createFindClub'
import {
  createFindClubByUuid,
  type FindClubByUuidParams,
} from './queries/createFindClubByClubUuid'
import {
  createInsertClub,
  type InsertClubParams,
} from './queries/createInsertClub'
import {
  createInsertClubOfferReportedBy,
  type InsertClubOfferReportedByRequest,
} from './queries/createInsertClubOfferReportedBy'
import {createListClubs} from './queries/createListClubs'
import {createListClubsWithExceededReportsCount} from './queries/createListClubsWithExceededReportsCount'
import {createListExpiredClubs} from './queries/createListExpiredClubs'
import {createListInactiveClubs} from './queries/createListInactiveClubs'
import {createListUserIdsForReportedClubOffer} from './queries/createListUserIdsForReportedClubOffer'
import {
  createUpdateClub,
  type UpdateClubParams,
} from './queries/createUpdateClub'
import {
  createUpdateReportClub,
  type UpdateReportClubRequest,
} from './queries/createUpdateReportClub'
import {
  createUpdateSetClubsInactive,
  type UpdateSetClubsInactiveParams,
} from './queries/createUpdateSetClubsInactive'

export interface ClubsDbOperations {
  deleteClub: (
    params: DeleteClubParams
  ) => Effect.Effect<void, UnexpectedServerError>
  findClub: (
    params: FindClubParams
  ) => Effect.Effect<Option.Option<ClubDbRecord>, UnexpectedServerError>
  findClubByUuid: (
    params: FindClubByUuidParams
  ) => Effect.Effect<Option.Option<ClubDbRecord>, UnexpectedServerError>
  insertClub: (
    params: InsertClubParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  insertClubOfferReportedBy: (
    args: InsertClubOfferReportedByRequest
  ) => Effect.Effect<void, UnexpectedServerError>
  updateClub: (
    params: UpdateClubParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  updateSetClubsInactive: (
    params: UpdateSetClubsInactiveParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  listClubs: () => Effect.Effect<readonly ClubDbRecord[], UnexpectedServerError>
  listExpiredClubs: () => Effect.Effect<
    readonly ClubDbRecord[],
    UnexpectedServerError
  >
  listClubsWithExceededReportsCount: () => Effect.Effect<
    readonly ClubDbRecord[],
    UnexpectedServerError
  >
  listInactiveClubs: () => Effect.Effect<
    readonly ClubDbRecord[],
    UnexpectedServerError
  >
  listUserIdsForReportedClubOffer: (
    args: OfferId
  ) => Effect.Effect<readonly PublicKeyPemBase64[], UnexpectedServerError>
  reportClub: (
    params: UpdateReportClubRequest
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class ClubsDbService extends Context.Tag('ClubsDbService')<
  ClubsDbService,
  ClubsDbOperations
>() {
  static readonly Live = Layer.effect(
    ClubsDbService,
    Effect.gen(function* (_) {
      const deleteClub = yield* _(createDeleteClub)
      const findClub = yield* _(createFindClub)
      const findClubByUuid = yield* _(createFindClubByUuid)
      const insertClub = yield* _(createInsertClub)
      const insertClubOfferReportedBy = yield* _(
        createInsertClubOfferReportedBy
      )
      const updateClub = yield* _(createUpdateClub)
      const updateSetClubsInactive = yield* _(createUpdateSetClubsInactive)
      const listClubs = yield* _(createListClubs)
      const listExpiredClubs = yield* _(createListExpiredClubs)
      const listClubsWithExceededReportsCount = yield* _(
        createListClubsWithExceededReportsCount
      )
      const listInactiveClubs = yield* _(createListInactiveClubs)
      const listUserIdsForReportedClubOffer = yield* _(
        createListUserIdsForReportedClubOffer
      )
      const reportClub = yield* _(createUpdateReportClub)

      return {
        deleteClub,
        findClub,
        findClubByUuid,
        insertClub,
        insertClubOfferReportedBy,
        updateClub,
        updateSetClubsInactive,
        listClubs,
        listExpiredClubs,
        listClubsWithExceededReportsCount,
        listInactiveClubs,
        listUserIdsForReportedClubOffer,
        reportClub,
      }
    })
  )
}
