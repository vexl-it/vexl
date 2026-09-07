import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {type GenerateInviteLinkForAdminResponse} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, pipe} from 'effect'
import {ClubInvitationLinkDbService} from '../../../db/ClubInvitationLinkDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {createFullLink} from '../utils/createFullLink'
import {generateRandomInviteCode} from '../utils/generateRandomInviteCode'
import {validateAdminToken} from '../utils/validateAdminToken'

export const generateClubInviteLink = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsAdmin',
  'generateClubInviteLinkForAdmin',
  (req) =>
    Effect.gen(function* () {
      yield* validateAdminToken(req.headers[HEADER_ADMIN_TOKEN])

      const clubsDb = yield* ClubsDbService
      const invitationDb = yield* ClubInvitationLinkDbService

      const club = yield* pipe(
        clubsDb.findClubByUuid({uuid: req.payload.clubUuid}),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', (e) => new NotFoundError())
      )

      const generatedLink = yield* pipe(
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
        Effect.retry({times: 3})
      )

      return {
        clubUuid: club.uuid,
        link: {
          code: generatedLink.code,
          fullLink: yield* createFullLink(generatedLink.code),
        },
      } satisfies GenerateInviteLinkForAdminResponse
    }).pipe(makeEndpointEffect)
)
