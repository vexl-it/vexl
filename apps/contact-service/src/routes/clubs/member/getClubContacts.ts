import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect, Option, pipe} from 'effect'
import {ClubMembersDbService} from '../../../db/ClubMemberDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {findClubMemberByPublicKeyV1OrV2} from '../../../utils/findClubMemberByPublicKeyV1OrV2'
import {toCompatiblePublicKeyArray} from '../../../utils/toCompatiblePublicKeyArray'

export const getClubContacts = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsMember',
  'getClubContacts',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const clubsDb = yield* ClubsDbService
      const clubMembersDb = yield* ClubMembersDbService

      const club = yield* pipe(
        clubsDb.findClubByUuid({uuid: req.payload.clubUuid}),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
          () => new NotFoundError({message: 'Club not found'})
        )
      )

      yield* pipe(
        findClubMemberByPublicKeyV1OrV2(
          Option.getOrElse(req.payload.publicKeyV2, () => req.payload.publicKey)
        ),
        Effect.filterOrFail(
          (member) => club.id === member.clubId,
          () => new NotFoundError({message: 'Club not found'})
        )
      )

      const clubContacts = yield* clubMembersDb.queryAllClubMembers({
        id: club.id,
      })

      return {
        clubUuid: req.payload.clubUuid,
        items: yield* toCompatiblePublicKeyArray(
          req.headers.clientVersionOrNone
        )(clubContacts),
      }
    }).pipe(
      Effect.withSpan('Fetch club contacts', {
        attributes: {clubId: req.payload.clubUuid},
      }),
      makeEndpointEffect
    )
)
