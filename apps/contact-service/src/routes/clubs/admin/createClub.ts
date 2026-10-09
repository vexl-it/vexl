import {HttpApiBuilder} from '@effect/platform/index'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ClubAlreadyExistsError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'

export const createClub = HttpApiBuilder.handler(
  ContactInternalApiSpecification,
  'ClubsAdmin',
  'createClub',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.headers[HEADER_ADMIN_TOKEN]))

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
          madeInactiveReason: Option.none(),
          report: 0,
        })
      )
      return {
        clubInfo: createdClub,
      }
    }).pipe(makeEndpointEffect)
)
