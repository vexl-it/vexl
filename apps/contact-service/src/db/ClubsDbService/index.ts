import {type OfferIdHashed} from '@vexl-next/domain/src/general/clubs'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {
  type ClubAdminDbRecord,
  type ClubDbRecord,
  type ClubOfferReporedInfoRecord,
} from './domain'
import {
  createDeleteClub,
  type DeleteClubParams,
} from './queries/createDeleteClubs'
import {createFindClub, type FindClubParams} from './queries/createFindClub'
import {
  createFindClubAdminByUuid,
  type FindClubAdminByUuidParams,
} from './queries/createFindClubAdminByClubUuid'
import {
  createFindClubByUuid,
  type FindClubByUuidParams,
} from './queries/createFindClubByClubUuid'
import {createFindReportInfoForOfferIdHashed} from './queries/createFindReportInfoForOfferIdHashed'
import {
  createInsertClub,
  type InsertClubParams,
} from './queries/createInsertClub'
import {
  createInsertClubOfferReportedInfo,
  type InsertClubOfferReportedInfoRequest,
} from './queries/createInsertClubOfferReportedInfo'
import {createListClubs} from './queries/createListClubs'
import {createListClubsWithExceededReportsCount} from './queries/createListClubsWithExceededReportsCount'
import {createListExpiredClubs} from './queries/createListExpiredClubs'
import {createListInactiveClubs} from './queries/createListInactiveClubs'
import {
  createUpdateClub,
  type UpdateClubParams,
} from './queries/createUpdateClub'
import {
  createUpdateReactivateClub,
  type UpdateReactivateClubParams,
} from './queries/createUpdateReactivateClub'
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
  findClubAdminByUuid: (
    params: FindClubAdminByUuidParams
  ) => Effect.Effect<Option.Option<ClubAdminDbRecord>, UnexpectedServerError>
  findReportInfoForOfferIdHashed: (
    args: OfferIdHashed
  ) => Effect.Effect<
    Option.Option<ClubOfferReporedInfoRecord>,
    UnexpectedServerError
  >
  insertClub: (
    params: InsertClubParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  insertClubOfferReportedInfo: (
    args: InsertClubOfferReportedInfoRequest
  ) => Effect.Effect<void, UnexpectedServerError>
  updateClub: (
    params: UpdateClubParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  updateSetClubsInactive: (
    params: UpdateSetClubsInactiveParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  updateReactivateClub: (
    params: UpdateReactivateClubParams
  ) => Effect.Effect<ClubDbRecord, UnexpectedServerError>
  listClubs: () => Effect.Effect<
    readonly ClubAdminDbRecord[],
    UnexpectedServerError
  >
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
  reportClub: (
    params: UpdateReportClubRequest
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class ClubsDbService extends Context.Service<
  ClubsDbService,
  ClubsDbOperations
>()('ClubsDbService') {
  static readonly Live = Layer.effect(
    ClubsDbService,
    Effect.gen(function* () {
      const deleteClub = yield* createDeleteClub
      const findClub = yield* createFindClub
      const findClubAdminByUuid = yield* createFindClubAdminByUuid
      const findClubByUuid = yield* createFindClubByUuid
      const insertClub = yield* createInsertClub
      const insertClubOfferReportedInfo =
        yield* createInsertClubOfferReportedInfo
      const updateClub = yield* createUpdateClub
      const updateSetClubsInactive = yield* createUpdateSetClubsInactive
      const updateReactivateClub = yield* createUpdateReactivateClub
      const listClubs = yield* createListClubs
      const listExpiredClubs = yield* createListExpiredClubs
      const listClubsWithExceededReportsCount =
        yield* createListClubsWithExceededReportsCount
      const listInactiveClubs = yield* createListInactiveClubs
      const findReportInfoForOfferIdHashed =
        yield* createFindReportInfoForOfferIdHashed
      const reportClub = yield* createUpdateReportClub

      return {
        deleteClub,
        findClub,
        findClubAdminByUuid,
        findClubByUuid,
        findReportInfoForOfferIdHashed,
        insertClub,
        insertClubOfferReportedInfo,
        updateClub,
        updateSetClubsInactive,
        updateReactivateClub,
        listClubs,
        listExpiredClubs,
        listClubsWithExceededReportsCount,
        listInactiveClubs,
        reportClub,
      }
    })
  )
}
