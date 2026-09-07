import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Array, Effect, pipe} from 'effect'
import {ClubMemberCountChangeDbService} from '../../../db/ClubMemberCountChangeDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'

export const getClubStats = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsAdmin',
  'getClubStats',
  (req) =>
    Effect.gen(function* () {
      yield* validateAdminToken(req.headers[HEADER_ADMIN_TOKEN])

      const clubsDb = yield* ClubsDbService
      const memberCountChangesDb = yield* ClubMemberCountChangeDbService
      const club = yield* pipe(
        clubsDb.findClubAdminByUuid({uuid: req.query.clubUuid}),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', () => new NotFoundError())
      )
      const changes = yield* memberCountChangesDb.listForClub({clubId: club.id})

      return {
        membersCount: club.membersCount,
        changes: pipe(
          changes,
          Array.map(({day, joinedCount, leftCount}) => ({
            day,
            joinedCount,
            leftCount,
          }))
        ),
      }
    }).pipe(makeEndpointEffect)
)
