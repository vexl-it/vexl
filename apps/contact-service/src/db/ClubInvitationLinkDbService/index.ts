import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type ClubInvitationLinkRecord} from './domain'
import {
  createDeleteInvitationLink,
  type DeleteClubInvivationLinkParams,
} from './queries/createDeleteInvitationLink'
import {
  createDeleteInvitationLinksForClub,
  type DeleteClubInvitationLinksForClubParams,
} from './queries/createDeleteInvitationLinksForClub'
import {
  createFindInvitationLinkByCode,
  type FindInvitationLinkbyCodeParams,
} from './queries/createFindInvitationLinkByCode'
import {
  createFindInvitationLinkByClubId,
  type FindInvitationLinkByClubIdParams,
} from './queries/createFindInvitationLinksByClubId'
import {
  createFindInvitationLinkByClubIdAndMemberId,
  type FindInvitationLinkByClubIdAndMemberIdParams,
} from './queries/createFindInvitationLinksByClubIdAndMemberId'
import {
  createInsertInvitationLink,
  type InsertClubInvitationLinkParams,
} from './queries/createInsertInvitationLink'

export interface ClubInvitationLinkDbOperations {
  deleteInvitationLink: (
    params: DeleteClubInvivationLinkParams
  ) => Effect.Effect<void, UnexpectedServerError>
  deleteInvitationLinksForClub: (
    params: DeleteClubInvitationLinksForClubParams
  ) => Effect.Effect<void, UnexpectedServerError>
  findInvitationLinkByCode: (
    params: FindInvitationLinkbyCodeParams
  ) => Effect.Effect<
    Option.Option<ClubInvitationLinkRecord>,
    UnexpectedServerError
  >
  findInvitationLinkByClubId: (
    params: FindInvitationLinkByClubIdParams
  ) => Effect.Effect<readonly ClubInvitationLinkRecord[], UnexpectedServerError>
  findInvitationLinkByClubIdAndMemberId: (
    params: FindInvitationLinkByClubIdAndMemberIdParams
  ) => Effect.Effect<readonly ClubInvitationLinkRecord[], UnexpectedServerError>
  insertInvitationLink: (
    params: InsertClubInvitationLinkParams
  ) => Effect.Effect<ClubInvitationLinkRecord, UnexpectedServerError>
}

export class ClubInvitationLinkDbService extends Context.Service<
  ClubInvitationLinkDbService,
  ClubInvitationLinkDbOperations
>()('ClubInvitationLinkDbService') {
  static readonly Live = Layer.effect(
    ClubInvitationLinkDbService,
    Effect.gen(function* () {
      const deleteInvitationLink = yield* createDeleteInvitationLink
      const deleteInvitationLinksForClub =
        yield* createDeleteInvitationLinksForClub
      const findInvitationLinkByCode = yield* createFindInvitationLinkByCode
      const findInvitationLinkByClubIdAndMemberId =
        yield* createFindInvitationLinkByClubIdAndMemberId
      const findInvitationLinkByClubId = yield* createFindInvitationLinkByClubId
      const insertInvitationLink = yield* createInsertInvitationLink

      return {
        deleteInvitationLink,
        deleteInvitationLinksForClub,
        findInvitationLinkByCode,
        findInvitationLinkByClubId,
        findInvitationLinkByClubIdAndMemberId,
        insertInvitationLink,
      }
    })
  )
}
