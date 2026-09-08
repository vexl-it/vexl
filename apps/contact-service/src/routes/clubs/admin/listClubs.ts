import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect, pipe} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'
import {clubDbRecordToClubAdminInfo} from './clubDbRecordToClubAdminInfo'

export const listClubs = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsAdmin',
  'listClubs',
  (req) =>
    Effect.gen(function* () {
      yield* validateAdminToken(req.headers[HEADER_ADMIN_TOKEN])

      const clubsDb = yield* ClubsDbService

      const clubs = yield* clubsDb.listClubs()

      return {
        clubs: pipe(clubs, Array.map(clubDbRecordToClubAdminInfo)),
      }
    }).pipe(makeEndpointEffect)
)
