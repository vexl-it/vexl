import {
  ClubAlreadyExistsError,
  CreateClubErrors,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {CreateClubEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {Handler} from 'effect-http'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'

export const createClub = Handler.make(CreateClubEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.query.adminToken))

      const clubsDb = yield* _(ClubsDbService)

      const existingClub = yield* _(
        clubsDb.findClubByUuid({uuid: req.body.club.uuid})
      )
      if (Option.isSome(existingClub)) {
        return yield* _(new ClubAlreadyExistsError())
      }

      const createdClub = yield* _(
        clubsDb.insertClub({
          ...req.body.club,
          madeInactiveAt: Option.none(),
          report: 0,
        })
      )
      return {
        clubInfo: createdClub,
      }
    }),
    CreateClubErrors
  )
)
