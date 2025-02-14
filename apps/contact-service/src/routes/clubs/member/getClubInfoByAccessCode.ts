import {
  NotFoundError,
  UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {GetClubInfoByAccessCodeErrors} from '@vexl-next/rest-api/src/services/contact/contracts'
import {GetClubInfoByAccessCodeEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {validateChallengeInBody} from '@vexl-next/server-utils/src/services/challenge/utils/validateChallengeInBody'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'

export const getClubInfoByAccessCode = Handler.make(
  GetClubInfoByAccessCodeEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(validateChallengeInBody(req.body))

        const clubsDb = yield* _(ClubsDbService)
        const clubInvitationLinkDb = yield* _(ClubInvitationLinkDbService)

        const inviteLink = yield* _(
          clubInvitationLinkDb.findInvitationLinkByCode({
            code: req.body.code,
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
                detail:
                  'Club not found by id from invitation link. This should not happen',
              })
          )
        )

        return {
          club,
        }
      }),
      GetClubInfoByAccessCodeErrors
    )
)
