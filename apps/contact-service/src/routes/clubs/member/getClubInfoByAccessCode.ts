import {HttpApiBuilder} from '@effect/platform/index'
import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect} from 'effect'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const getClubInfoByAccessCode = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsMember',
  'getClubInfoByAccessCode',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateChallengeInBody(req.payload))

      const clubsDb = yield* _(ClubsDbService)
      const clubInvitationLinkDb = yield* _(ClubInvitationLinkDbService)

      const inviteLink = yield* _(
        clubInvitationLinkDb.findInvitationLinkByCode({
          code: req.payload.code,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
          () =>
            new NotFoundError({
              message: 'Invitation link not found error',
            })
        )
      )

      const club = yield* _(
        clubsDb.findClub({
          id: inviteLink.clubId,
        }),
        Effect.flatten,
        Effect.catchTag(
          'NoSuchElementException',
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
