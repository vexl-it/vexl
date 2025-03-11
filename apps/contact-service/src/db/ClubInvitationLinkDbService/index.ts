import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Context, Effect, Layer, type Option} from 'effect'
import {type ClubInvitationLinkRecord} from './domain'
import {
  createDeleteInvitationLink,
  type DeleteClubInvivationLinkParams,
} from './queries/createDeleteInvitationLink'
import {
  createFindInvitationLinkByCode,
  type FindInvitationLinkbyCodeParams,
} from './queries/createFindInvitationLinkByCode'
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
  findInvitationLinkByCode: (
    params: FindInvitationLinkbyCodeParams
  ) => Effect.Effect<
    Option.Option<ClubInvitationLinkRecord>,
    UnexpectedServerError
  >
  findInvitationLinkByClubIdAndMemberId: (
    params: FindInvitationLinkByClubIdAndMemberIdParams
  ) => Effect.Effect<readonly ClubInvitationLinkRecord[], UnexpectedServerError>
  insertInvitationLink: (
    params: InsertClubInvitationLinkParams
  ) => Effect.Effect<ClubInvitationLinkRecord, UnexpectedServerError>
}

export class ClubInvitationLinkDbService extends Context.Tag(
  'ClubInvitationLinkDbService'
)<ClubInvitationLinkDbService, ClubInvitationLinkDbOperations>() {
  static readonly Live = Layer.effect(
    ClubInvitationLinkDbService,
    Effect.gen(function* (_) {
      const deleteInvitationLink = yield* _(createDeleteInvitationLink)
      const findInvitationLinkByCode = yield* _(createFindInvitationLinkByCode)
      const findInvitationLinkByClubIdAndMemberId = yield* _(
        createFindInvitationLinkByClubIdAndMemberId
      )
      const insertInvitationLink = yield* _(createInsertInvitationLink)
      return {
        deleteInvitationLink,
        findInvitationLinkByCode,
        findInvitationLinkByClubIdAndMemberId,
        insertInvitationLink,
      }
    })
  )
}
