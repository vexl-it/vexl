import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'

export const modifyClub = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsAdmin',
  'modifyClub',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.urlParams.adminToken))

      const clubsDb = yield* _(ClubsDbService)

      const existingClub = yield* _(
        clubsDb.findClubByUuid({uuid: req.payload.clubInfo.uuid}),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', (e) => new NotFoundError())
      )

      const modifiedClub = yield* _(
        clubsDb.updateClub({
          id: existingClub.id,
          data: {
            ...req.payload.clubInfo,
            madeInactiveAt: existingClub.madeInactiveAt,
            report: existingClub.report,
          },
        })
      )
      return {
        clubInfo: modifiedClub,
      }
    }).pipe(makeEndpointEffect)
)
