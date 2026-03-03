import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {PublicKeyV2MissingError} from '@vexl-next/rest-api/src/challenges/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect, Option} from 'effect'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const setPublicKeyV2 = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsMember',
  'setPublicKeyV2',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const clubsDb = yield* _(ClubsDbService)
      const membersDb = yield* _(ClubMembersDbService)
      const club = yield* _(
        clubsDb.findClubByUuid({
          uuid: req.payload.clubUuid,
        }),
        Effect.flatten
      )

      const member = yield* _(
        membersDb.findClubMember({
          id: club.id,
          publicKey: req.payload.publicKey,
        }),
        Effect.flatten
      )

      if (Option.isNone(req.payload.publicKeyV2)) {
        return yield* _(new PublicKeyV2MissingError())
      }

      yield* _(
        membersDb.updateClubMemberPublicKeyV2({
          clubMemberId: member.id,
          publicKeyV2: req.payload.publicKeyV2.value,
        })
      )

      return {result: 'ok'}
    }).pipe(
      Effect.catchTag(
        'NoSuchElementException',
        () => new NotFoundError({message: 'Club or member not found'})
      ),
      makeEndpointEffect
    )
)
