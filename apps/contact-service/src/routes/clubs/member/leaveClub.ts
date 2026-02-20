import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Array, Effect, flow, Option} from 'effect'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {findClubMemberByPublicKeyV1OrV2} from '../../../utils/findClubMemberByPublicKeyV1OrV2'

export const leaveClub = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsMember',
  'leaveClub',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)
      const linkDb = yield* _(ClubInvitationLinkDbService)

      const member = yield* _(
        findClubMemberByPublicKeyV1OrV2(
          Option.getOrElse(req.payload.publicKeyV2, () => req.payload.publicKey)
        )
      )

      const club = yield* _(
        clubsDb.findClubByUuid({
          uuid: req.payload.clubUuid,
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

      if (Option.isSome(req.payload.publicKeyV2)) {
        yield* membersDb.deleteClubMemberByPublicKeyV2({
          clubId: club.id,
          publicKeyV2: req.payload.publicKeyV2.value,
        })
      } else {
        yield* _(
          membersDb.deleteClubMember({
            clubId: club.id,
            publicKey: req.payload.publicKey,
          })
        )
      }

      return {}
    }).pipe(makeEndpointEffect)
)
