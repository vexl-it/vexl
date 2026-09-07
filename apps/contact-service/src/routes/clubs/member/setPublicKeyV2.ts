import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {PublicKeyV2MissingError} from '@vexl-next/rest-api/src/challenges/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect, Option, pipe} from 'effect'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const setPublicKeyV2 = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsMember',
  'setPublicKeyV2',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const clubsDb = yield* ClubsDbService
      const membersDb = yield* ClubMembersDbService
      const club = yield* pipe(
        clubsDb.findClubByUuid({
          uuid: req.payload.clubUuid,
        }),
        Effect.flatMap(Effect.fromOption)
      )

      const member = yield* pipe(
        membersDb.findClubMember({
          id: club.id,
          publicKey: req.payload.publicKey,
        }),
        Effect.flatMap(Effect.fromOption)
      )

      if (Option.isNone(req.payload.publicKeyV2)) {
        return yield* new PublicKeyV2MissingError()
      }

      yield* membersDb.updateClubMemberPublicKeyV2({
        clubMemberId: member.id,
        publicKeyV2: req.payload.publicKeyV2.value,
      })

      return {result: 'ok'}
    }).pipe(
      Effect.catchTag(
        'NoSuchElementError',
        () => new NotFoundError({message: 'Club or member not found'})
      ),
      makeEndpointEffect
    )
)
