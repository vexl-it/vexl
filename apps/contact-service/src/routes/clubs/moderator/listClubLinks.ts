import {type ClubLinkInfo} from '@vexl-next/domain/src/general/clubs'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  ListClubLinksErrors,
  type ListClubLinksResponse,
  UserIsNotModeratorError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ListClubLinksEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {createFullLink} from '../utils/createFullLink'

export const listClubLinks = Handler.make(ListClubLinksEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const membersDb = yield* _(ClubMembersDbService)
      const clubsDb = yield* _(ClubsDbService)
      const linksDb = yield* _(ClubInvitationLinkDbService)

      const moderatorMember = yield* _(
        membersDb.findClubMemberByPublicKey({publicKey: req.body.publicKey}),
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
        clubsDb.findClubByUuid({uuid: req.body.clubUuid}),
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

      const links = yield* _(
        linksDb.findInvitationLinkByClubIdAndMemberId({
          clubId: club.id,
          memberId: moderatorMember.id,
        }),
        Effect.flatMap(
          Effect.forEach((link) =>
            createFullLink(link.code).pipe(
              Effect.map(
                (fullLink) =>
                  ({code: link.code, fullLink}) satisfies ClubLinkInfo
              )
            )
          )
        )
      )

      return {
        clubUuid: club.uuid,
        links,
      } satisfies ListClubLinksResponse
    }).pipe(withDbTransaction),
    ListClubLinksErrors
  )
)
