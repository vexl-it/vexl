import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect, pipe} from 'effect'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const getClubInfoByAccessCode = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsMember',
  'getClubInfoByAccessCode',
  (req) =>
    Effect.gen(function* () {
      yield* validateChallengeInBody(req.payload)

      const clubsDb = yield* ClubsDbService
      const clubInvitationLinkDb = yield* ClubInvitationLinkDbService

      const inviteLink = yield* pipe(
        clubInvitationLinkDb.findInvitationLinkByCode({
          code: req.payload.code,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
          () =>
            new NotFoundError({
              message: 'Invitation link not found error',
            })
        )
      )

      const club = yield* pipe(
        clubsDb.findClub({
          id: inviteLink.clubId,
        }),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag(
          'NoSuchElementError',
          () =>
            new UnexpectedServerError({
              status: 500,
              cause: new Error('Club not found by id from invitation link'),
              message:
                'Club not found by id from invitation link. This should not happen',
            })
        )
      )

      return {
        club,
        isModerator: inviteLink.forAdmin,
      }
    }).pipe(makeEndpointEffect)
)
