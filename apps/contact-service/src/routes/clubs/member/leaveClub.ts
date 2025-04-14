import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {LeaveClubErrors} from '@vexl-next/rest-api/src/services/contact/contracts'
import {LeaveClubEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect, flow} from 'effect'
import {Handler} from 'effect-http'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const leaveClub = Handler.make(LeaveClubEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.body))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)
      const linkDb = yield* _(ClubInvitationLinkDbService)

      const member = yield* _(
        membersDb.findClubMemberByPublicKey({
          publicKey: req.body.publicKey,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () => new NotFoundError({message: 'Member not found'})
        )
      )

      const club = yield* _(
        clubsDb.findClubByUuid({
          uuid: req.body.clubUuid,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () =>
            new NotFoundError({
              message: 'Club not found',
            })
        ),
        Effect.filterOrFail(
          (club) => club.id === member.clubId,
          () => new NotFoundError({message: 'Club not found'})
        )
      )

      yield* _(
        linkDb.findInvitationLinkByClubIdAndMemberId({
          clubId: club.id,
          memberId: member.id,
        }),
        Effect.flatMap(
          flow(
            Array.map((link) => linkDb.deleteInvitationLink({id: link.id})),
            Effect.all
          )
        )
      )

      yield* _(
        membersDb.deleteClubMember({
          clubId: club.id,
          publicKey: req.body.publicKey,
        })
      )

      return {}
    }),
    LeaveClubErrors
  )
)
