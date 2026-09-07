import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, pipe} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'

export const modifyClub = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsAdmin',
  'modifyClub',
  (req) =>
    Effect.gen(function* () {
      yield* validateAdminToken(req.headers[HEADER_ADMIN_TOKEN])

      const clubsDb = yield* ClubsDbService

      const existingClub = yield* pipe(
        clubsDb.findClubByUuid({uuid: req.payload.clubInfo.uuid}),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', (e) => new NotFoundError())
      )

      const modifiedClub = yield* clubsDb.updateClub({
        id: existingClub.id,
        data: {
          ...req.payload.clubInfo,
          madeInactiveAt: existingClub.madeInactiveAt,
          madeInactiveReason: existingClub.madeInactiveReason,
          report: existingClub.report,
        },
      })
      return {
        clubInfo: modifiedClub,
      }
    }).pipe(makeEndpointEffect)
)
