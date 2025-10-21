import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {type GenerateInviteLinkForAdminResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {createFullLink} from '../utils/createFullLink'
import {generateRandomInviteCode} from '../utils/generateRandomInviteCode'
import {validateAdminToken} from '../utils/validateAdminToken'

export const generateClubInviteLink = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsAdmin',
  'generateClubInviteLinkForAdmin',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.urlParams.adminToken))

      const clubsDb = yield* _(ClubsDbService)
      const invitationDb = yield* _(ClubInvitationLinkDbService)

      const club = yield* _(
        clubsDb.findClubByUuid({uuid: req.payload.clubUuid}),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', (e) => new NotFoundError())
      )

      const generatedLink = yield* _(
        generateRandomInviteCode,
        Effect.flatMap((code) =>
          invitationDb.insertInvitationLink({
            clubId: club.id,
            createdByMemberId: null,
            forAdmin: true,
            code,
          })
        ),
        Effect.tapError((e) =>
          Effect.log(
            'Error in insertInvitationLink. Code is probably not unique. Retrying...',
            e
          )
        ),
        Effect.retry({times: 3}) // retry if code is not unique
      )

      return {
        clubUuid: club.uuid,
        link: {
          code: generatedLink.code,
          fullLink: yield* _(createFullLink(generatedLink.code)),
        },
      } satisfies GenerateInviteLinkForAdminResponse
    }).pipe(makeEndpointEffect)
)
