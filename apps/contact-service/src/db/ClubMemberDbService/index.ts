import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type ClubMemberRecord} from './domain'
import {
  createCountClubMemebers,
  type CountClubMemebersParams,
} from './queries/createCountClubMemebers'
import {
  createDeleteClubMemeber,
  type DeleteClubMemberParams,
} from './queries/createDeleteClubMemeber'
import {
  createFindClubMemeber,
  type FindClubMemberParams,
} from './queries/createFindClubMemember'
import {
  createInsertClubMember,
  type InsertClubMemeberParams,
} from './queries/createInsertClubMemeber'
import {
  createQueryAllClubMembers,
  type QueryAllClubMemebersParams as QueryAllClubMembersParams,
} from './queries/createQueryAllClubMembers'
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

export interface ClubMembersDbOperations {
  countClubMembers: (
    params: CountClubMemebersParams
  ) => Effect.Effect<number, UnexpectedServerError>
  deleteClubMember: (
    params: DeleteClubMemberParams
  ) => Effect.Effect<void, UnexpectedServerError>
  findClubMember: (
    params: FindClubMemberParams
  ) => Effect.Effect<Option.Option<ClubMemberRecord>, UnexpectedServerError>
  insertClubMember: (
    params: InsertClubMemeberParams
  ) => Effect.Effect<ClubMemberRecord, UnexpectedServerError>
  queryAllClubMembers: (
    params: QueryAllClubMembersParams
  ) => Effect.Effect<readonly ClubMemberRecord[], UnexpectedServerError>
  updateIsModerator: (
    params: UpdateIsModeratorParamas
  ) => Effect.Effect<ClubMemberRecord, UnexpectedServerError>
  updateLastRefreshedAt: (
    params: UpdateLastRefreshedAtParams
  ) => Effect.Effect<ClubMemberRecord, UnexpectedServerError>
  updateNotificationToken: (
    params: UpdateNotificationTokenParams
  ) => Effect.Effect<ClubMemberRecord, UnexpectedServerError>
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
      const findClubMember = yield* _(createFindClubMemeber)
      const insertClubMember = yield* _(createInsertClubMember)
      const queryAllClubMembers = yield* _(createQueryAllClubMembers)
      const updateIsModerator = yield* _(createUpdateIsModerator)
      const updateLastRefreshedAt = yield* _(CreateUpdateLastRefreshedAt)
      const updateNotificationToken = yield* _(createUpdateNotificationToken)

      return {
        countClubMembers,
        deleteClubMember,
        findClubMember,
        insertClubMember,
        queryAllClubMembers,
        updateIsModerator,
        updateLastRefreshedAt,
        updateNotificationToken,
      }
    })
  )
}
