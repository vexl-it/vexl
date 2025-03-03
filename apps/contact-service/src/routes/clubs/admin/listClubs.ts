import {ListClubsErrors} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ListClubsEndpoint} from '@vexl-next/rest-api/src/services/contact/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {Handler} from 'effect-http'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from './utils/validateAdminToken'

export const listClubs = Handler.make(ListClubsEndpoint, (req) =>
  makeEndpointEffect(
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.query.adminToken))

      const clubsDb = yield* _(ClubsDbService)

      return {clubs: yield* _(clubsDb.listClubs())}
    }),
    ListClubsErrors
  )
)
