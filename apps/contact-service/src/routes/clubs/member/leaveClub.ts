import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {withDbTransaction} from '@vexl-next/server-utils/src/withDbTransaction'
import {Array, Effect, flow, Option, pipe} from 'effect'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubMemberCountChangeDbService} from '../../../db/ClubMemberCountChangeDbService'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {findClubMemberByPublicKeyV1OrV2} from '../../../utils/findClubMemberByPublicKeyV1OrV2'

export const leaveClub = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsMember',
  'leaveClub',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const clubsDb = yield* ClubsDbService
      const membersDb = yield* ClubMembersDbService
      const memberCountChangesDb = yield* ClubMemberCountChangeDbService
      const linkDb = yield* ClubInvitationLinkDbService

      const member = yield* findClubMemberByPublicKeyV1OrV2(
        Option.getOrElse(req.payload.publicKeyV2, () => req.payload.publicKey)
      )

      const club = yield* pipe(
        clubsDb.findClubByUuid({
          uuid: req.payload.clubUuid,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
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

      yield* pipe(
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
        yield* membersDb.deleteClubMember({
          clubId: club.id,
          publicKey: req.payload.publicKey,
        })
      }

      yield* memberCountChangesDb.incrementLeft({clubId: club.id, count: 1})

      return {}
    }).pipe(withDbTransaction, makeEndpointEffect)
)
