import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Array, Effect, pipe} from 'effect'
import {ClubMemberCountChangeDbService} from '../../../db/ClubMemberCountChangeDbService'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'

export const getClubStats = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsAdmin',
  'getClubStats',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.headers[HEADER_ADMIN_TOKEN]))

      const clubsDb = yield* _(ClubsDbService)
      const memberCountChangesDb = yield* _(ClubMemberCountChangeDbService)
      const club = yield* _(
        clubsDb.findClubAdminByUuid({uuid: req.urlParams.clubUuid}),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', () => new NotFoundError())
      )
      const changes = yield* _(
        memberCountChangesDb.listForClub({clubId: club.id})
      )

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
