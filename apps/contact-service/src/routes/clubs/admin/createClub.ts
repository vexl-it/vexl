import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ClubAlreadyExistsError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, Option} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'

export const createClub = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsAdmin',
  'createClub',
  (req) =>
    Effect.gen(function* () {
      yield* validateAdminToken(req.headers[HEADER_ADMIN_TOKEN])

      const clubsDb = yield* ClubsDbService

      const existingClub = yield* clubsDb.findClubByUuid({
        uuid: req.payload.club.uuid,
      })
      if (Option.isSome(existingClub)) {
        return yield* new ClubAlreadyExistsError()
      }

      const createdClub = yield* clubsDb.insertClub({
        ...req.payload.club,
        madeInactiveAt: Option.none(),
        madeInactiveReason: Option.none(),
        report: 0,
      })
      return {
        clubInfo: createdClub,
      }
    }).pipe(makeEndpointEffect)
)
