import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ModifyClubErrors} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ModfiyClubEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'

export const modifyClub = Handler.make(ModfiyClubEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.query.adminToken))

      const clubsDb = yield* _(ClubsDbService)

      const existingClub = yield* _(
        clubsDb.findClubByUuid({uuid: req.body.clubInfo.uuid}),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', (e) => new NotFoundError())
      )

      const modifiedClub = yield* _(
        clubsDb.updateClub({
          id: existingClub.id,
          data: {
            ...req.body.clubInfo,
            madeInactiveAt: existingClub.madeInactiveAt,
            report: existingClub.report,
          },
        })
      )
      return {
        clubInfo: modifiedClub,
      }
    }),
    ModifyClubErrors
  )
)
