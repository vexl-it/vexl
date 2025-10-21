import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type DeactivateClubJoinLinkResponse,
  InviteCodeNotFoundError,
  UserIsNotModeratorError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const deactivateClubJoinLink = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsModerator',
  'deactivateClubJoinLink',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const membersDb = yield* _(ClubMembersDbService)
      const clubsDb = yield* _(ClubsDbService)
      const linksDb = yield* _(ClubInvitationLinkDbService)

      const moderatorMember = yield* _(
        membersDb.findClubMemberByPublicKey({publicKey: req.payload.publicKey}),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new NotFoundError({message: 'Member not found'})
        ),
        Effect.filterOrFail(
          (member) => member.isModerator,
          () => new UserIsNotModeratorError()
        )
      )

      const club = yield* _(
        clubsDb.findClubByUuid({uuid: req.payload.clubUuid}),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new NotFoundError({message: 'Club not found'})
        ),
        Effect.filterOrFail(
          (club) => club.id === moderatorMember.clubId,
          () => new NotFoundError({message: 'Club not found'})
        )
      )

      const link = yield* _(
        linksDb.findInvitationLinkByCode({code: req.payload.code}),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new InviteCodeNotFoundError()
        ),
        Effect.filterOrFail(
          (link) => link.clubId === club.id,
          () => new InviteCodeNotFoundError()
        )
      )
      yield* _(linksDb.deleteInvitationLink({id: link.id}))

      return {
        clubUuid: club.uuid,
        deactivatedCode: link.code,
      } satisfies DeactivateClubJoinLinkResponse
    }).pipe(withDbTransaction, makeEndpointEffect)
)
