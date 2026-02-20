import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type ClubMemberRecord} from './domain'
import {
  createCountClubMemebers,
  type CountClubMemebersParams,
} from './queries/createCountClubMemebers'
import {
  createDeleteAllClubMemebers,
  type DeleteAllClubMemberParams,
} from './queries/createDeleteAllClubMembers'
import {
  createDeleteClubMembersLastActiveBefore,
  type DeleteClubMembersLastActiveBeforeParams,
} from './queries/createDeleteClubMembersLastActiveBefore'
import {
  createDeleteClubMemeber,
  type DeleteClubMemberParams,
} from './queries/createDeleteClubMemeber'
import {
  createDeleteClubMemeberByPublicKeyV2,
  type DeleteClubMemberByPublicKeyV2Params,
} from './queries/createDeleteClubMemeberByPublicKeyV2'
import {createDeleteClubReportedRecordByReportedAtBefore} from './queries/createDeleteClubReportedRecordByReportedAtBefore'
import {
  createFindClubMemeberByPublicKey,
  type FindClubMemberByPublicKeyParams,
} from './queries/createFindClubMemberByPublicKey'
import {
  createFindClubMemeberByPublicKeyV2,
  type FindClubMemberByPublicKeyV2Params,
} from './queries/createFindClubMemberByPublicKeyV2'
import {
  createFindClubMemeber,
  type FindClubMemberParams,
} from './queries/createFindClubMemember'
import {
  createInsertClubMember,
  type InsertClubMemeberParams,
} from './queries/createInsertClubMemeber'
import {
  createInsertClubReportedRecord,
  type InsertClubReportedRecordParams,
} from './queries/createInsertClubReportedRecord'
import {
  createQueryAllClubMembers,
  type QueryAllClubMemebersParams as QueryAllClubMembersParams,
} from './queries/createQueryAllClubMembers'
import {createQueryNumberOfClubReportsForUser} from './queries/createQueryNumberOfClubReportsForUser'
import {
  createUpdateClubMemberPublicKeyV2,
  type UpdateClubMemberPublicKeyV2Params,
} from './queries/createUpdateClubMemberPublicKeyV2'
import {
  createUpdateIsModerator,
  type UpdateIsModeratorParamas,
} from './queries/createUpdateIsModerator'
import {
  CreateUpdateLastRefreshedAt,
  type UpdateLastRefreshedAtParams,
} from './queries/createUpdateLastRefreshedAt'
import {
  createUpdateNotificationToken,
  type UpdateNotificationTokenParams,
} from './queries/createUpdateNotificationToken'
import {
  createUpdateVexlNotificationToken,
  type UpdateVexlNotificationTokenParams,
} from './queries/createUpdateVexlNotificationToken'

export interface ClubMembersDbOperations {
  countClubMembers: (
    params: CountClubMemebersParams
  ) => Effect.Effect<number, UnexpectedServerError>
  deleteClubMember: (
    params: DeleteClubMemberParams
  ) => Effect.Effect<void, UnexpectedServerError>
  deleteClubMemberByPublicKeyV2: (
    params: DeleteClubMemberByPublicKeyV2Params
  ) => Effect.Effect<void, UnexpectedServerError>
  deleteAllClubMembers: (
    params: DeleteAllClubMemberParams
  ) => Effect.Effect<void, UnexpectedServerError>
  deleteClubMembersLastActiveBefore: (
    params: DeleteClubMembersLastActiveBeforeParams
  ) => Effect.Effect<void, UnexpectedServerError>
  deleteClubReportedRecordByReportedAtBefore: (
    params: number
  ) => Effect.Effect<void, UnexpectedServerError>
  findClubMember: (
    params: FindClubMemberParams
  ) => Effect.Effect<Option.Option<ClubMemberRecord>, UnexpectedServerError>
  insertClubMember: (
    params: InsertClubMemeberParams
  ) => Effect.Effect<ClubMemberRecord, UnexpectedServerError>
  insertClubReportedRecord: (
    params: InsertClubReportedRecordParams
  ) => Effect.Effect<void, UnexpectedServerError>
  queryAllClubMembers: (
    params: QueryAllClubMembersParams
  ) => Effect.Effect<readonly ClubMemberRecord[], UnexpectedServerError>
  queryNumberOfClubReportsForUser: (
    params: PublicKeyPemBase64
  ) => Effect.Effect<number, UnexpectedServerError>
  updateIsModerator: (
    params: UpdateIsModeratorParamas
  ) => Effect.Effect<ClubMemberRecord, UnexpectedServerError>
  updateLastRefreshedAt: (
    params: UpdateLastRefreshedAtParams
  ) => Effect.Effect<ClubMemberRecord, UnexpectedServerError>
  updateNotificationToken: (
    params: UpdateNotificationTokenParams
  ) => Effect.Effect<ClubMemberRecord, UnexpectedServerError>
  updateVexlNotificationToken: (
    params: UpdateVexlNotificationTokenParams
  ) => Effect.Effect<ClubMemberRecord, UnexpectedServerError>
  findClubMemberByPublicKey: (
    params: FindClubMemberByPublicKeyParams
  ) => Effect.Effect<Option.Option<ClubMemberRecord>, UnexpectedServerError>
  findClubMemberByPublicKeyV2: (
    params: FindClubMemberByPublicKeyV2Params
  ) => Effect.Effect<Option.Option<ClubMemberRecord>, UnexpectedServerError>

  updateClubMemberPublicKeyV2: (
    params: UpdateClubMemberPublicKeyV2Params
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class ClubMembersDbService extends Context.Tag('ClubMembersDbService')<
  ClubMembersDbService,
  ClubMembersDbOperations
>() {
  static readonly Live = Layer.effect(
    ClubMembersDbService,
    Effect.gen(function* (_) {
      const countClubMembers = yield* _(createCountClubMemebers)
      const deleteClubMember = yield* _(createDeleteClubMemeber)
      const deleteClubMemberByPublicKeyV2 = yield* _(
        createDeleteClubMemeberByPublicKeyV2
      )
      const findClubMember = yield* _(createFindClubMemeber)
      const findClubMemberByPublicKey = yield* _(
        createFindClubMemeberByPublicKey
      )
      const findClubMemberByPublicKeyV2 = yield* _(
        createFindClubMemeberByPublicKeyV2
      )
      const insertClubMember = yield* _(createInsertClubMember)
      const insertClubReportedRecord = yield* _(createInsertClubReportedRecord)
      const queryAllClubMembers = yield* _(createQueryAllClubMembers)
      const queryNumberOfClubReportsForUser = yield* _(
        createQueryNumberOfClubReportsForUser
      )
      const updateIsModerator = yield* _(createUpdateIsModerator)
      const updateLastRefreshedAt = yield* _(CreateUpdateLastRefreshedAt)
      const updateNotificationToken = yield* _(createUpdateNotificationToken)
      const updateVexlNotificationToken = yield* _(
        createUpdateVexlNotificationToken
      )
      const deleteAllClubMembers = yield* _(createDeleteAllClubMemebers)
      const deleteClubMembersLastActiveBefore = yield* _(
        createDeleteClubMembersLastActiveBefore
      )
      const deleteClubReportedRecordByReportedAtBefore = yield* _(
        createDeleteClubReportedRecordByReportedAtBefore
      )
      const updateClubMemberPublicKeyV2 = yield* _(
        createUpdateClubMemberPublicKeyV2
      )

      return {
        countClubMembers,
        deleteClubMember,
        deleteClubMemberByPublicKeyV2,
        findClubMember,
        findClubMemberByPublicKey,
        findClubMemberByPublicKeyV2,
        insertClubMember,
        insertClubReportedRecord,
        queryAllClubMembers,
        queryNumberOfClubReportsForUser,
        updateIsModerator,
        updateLastRefreshedAt,
        deleteClubMembersLastActiveBefore,
        updateNotificationToken,
        updateVexlNotificationToken,
        deleteAllClubMembers,
        deleteClubReportedRecordByReportedAtBefore,
        updateClubMemberPublicKeyV2,
      }
    })
  )
}
