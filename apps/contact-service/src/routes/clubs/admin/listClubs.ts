import {HttpApiBuilder} from '@effect/platform/index'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'
import {clubDbRecordToClubAdminInfo} from './clubDbRecordToClubAdminInfo'

export const listClubs = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsAdmin',
  'listClubs',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.headers[HEADER_ADMIN_TOKEN]))

      const clubsDb = yield* _(ClubsDbService)

      const clubs = yield* _(clubsDb.listClubs())

      return {
        clubs: pipe(clubs, Array.map(clubDbRecordToClubAdminInfo)),
      }
    }).pipe(makeEndpointEffect)
)
