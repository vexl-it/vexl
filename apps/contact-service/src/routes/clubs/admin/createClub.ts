import {HttpApiBuilder} from '@effect/platform/index'
import {ClubAlreadyExistsError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'

export const createClub = HttpApiBuilder.handler(
  ContactApiSpecification,
  'ClubsAdmin',
  'createClub',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.urlParams.adminToken))

      const clubsDb = yield* _(ClubsDbService)

      const existingClub = yield* _(
        clubsDb.findClubByUuid({uuid: req.payload.club.uuid})
      )
      if (Option.isSome(existingClub)) {
        return yield* _(new ClubAlreadyExistsError())
      }

      const createdClub = yield* _(
        clubsDb.insertClub({
          ...req.payload.club,
          madeInactiveAt: Option.none(),
          report: 0,
          adminNote: req.payload.adminNote,
        })
      )
      return {
        clubInfo: createdClub,
      }
    }).pipe(makeEndpointEffect)
)
