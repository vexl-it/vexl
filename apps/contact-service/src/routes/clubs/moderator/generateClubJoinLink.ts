import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {
  GenerateClubJoinLinkErrors,
  type GenerateClubJoinLinkResponse,
  UserIsNotModeratorError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {GenerateClubJoinLinkEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {createFullLink} from '../utils/createFullLink'
import {generateRandomInviteCode} from '../utils/generateRandomInviteCode'

export const generateClubJoinLink = Handler.make(
  GenerateClubJoinLinkEndpoint,
  (req) =>
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

        const link = yield* _(
          generateRandomInviteCode,
          Effect.flatMap((code) =>
            linksDb.insertInvitationLink({
              clubId: club.id,
              createdByMemberId: moderatorMember.id,
              code,
              forAdmin: false,
            })
          ),
          Effect.retry({times: 3})
        )

        return {
          clubUuid: club.uuid,
          codeInfo: {
            code: link.code,
            fullLink: yield* _(createFullLink(link.code)),
          },
        } satisfies GenerateClubJoinLinkResponse
      }).pipe(withDbTransaction),
      GenerateClubJoinLinkErrors
    )
)
