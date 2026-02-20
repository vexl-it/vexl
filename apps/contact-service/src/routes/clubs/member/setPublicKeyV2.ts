import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {PublicKeyV2MissingError} from '@vexl-next/rest-api/src/challenges/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect, Option} from 'effect'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'

export const setPublicKeyV2 = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsMember',
  'setPublicKeyV2',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const membersDb = yield* _(ClubMembersDbService)

      const member = yield* _(
        membersDb.findClubMemberByPublicKey({
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
        () => new NotFoundError({message: 'Member not found'})
      ),
      makeEndpointEffect
    )
)
