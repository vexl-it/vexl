import {HttpApiBuilder} from '@effect/platform/index'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {clubDbRecordToClubAdminInfo} from './clubDbRecordToClubAdminInfo'

export const listClubs = HttpApiBuilder.handler(
  ContactInternalApiSpecification,
  'ClubsAdmin',
  'listClubs',
  () =>
    Effect.gen(function* (_) {
      const clubsDb = yield* _(ClubsDbService)

      const clubs = yield* _(clubsDb.listClubs())

      return {
        clubs: pipe(clubs, Array.map(clubDbRecordToClubAdminInfo)),
      }
    }).pipe(makeEndpointEffect)
)
