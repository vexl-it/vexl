import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ClubCannotBeReactivatedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactApiSpecification} from '@vexl-next/rest-api/src/services/contact/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, pipe} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {validateAdminToken} from '../utils/validateAdminToken'
import {clubDbRecordToClubAdminInfo} from './clubDbRecordToClubAdminInfo'

export const reactivateClub = makeHttpApiHandler(
  ContactApiSpecification,
  'ClubsAdmin',
  'reactivateClub',
  (req) =>
    Effect.gen(function* () {
      yield* validateAdminToken(req.headers[HEADER_ADMIN_TOKEN])

      const clubsDb = yield* ClubsDbService
      const club = yield* pipe(
        clubsDb.findClubByUuid({uuid: req.payload.clubUuid}),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', () => new NotFoundError())
      )

      if (club.validUntil < new Date()) {
        return yield* new ClubCannotBeReactivatedError({
          reactivationBlockedReason: 'PAST_VALIDITY',
        })
      }

      if (club.report >= club.reportLimit) {
        return yield* new ClubCannotBeReactivatedError({
          reactivationBlockedReason: 'REPORT_LIMIT_REACHED',
        })
      }

      yield* clubsDb.updateReactivateClub({clubUuid: club.uuid})
      const reactivatedClub = yield* pipe(
        clubsDb.findClubAdminByUuid({uuid: club.uuid}),
        Effect.flatMap(Effect.fromOption),
        Effect.catchTag('NoSuchElementError', () => new NotFoundError())
      )

      return {clubInfo: clubDbRecordToClubAdminInfo(reactivatedClub)}
    }).pipe(makeEndpointEffect)
)
