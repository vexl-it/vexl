import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ClubCannotBeReactivatedError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {ClubsDbService} from '../../../db/ClubsDbService'
import {clubDbRecordToClubAdminInfo} from './clubDbRecordToClubAdminInfo'

export const reactivateClub = HttpApiBuilder.handler(
  ContactInternalApiSpecification,
  'ClubsAdmin',
  'reactivateClub',
  (req) =>
    Effect.gen(function* (_) {
      const clubsDb = yield* _(ClubsDbService)
      const club = yield* _(
        clubsDb.findClubByUuid({uuid: req.payload.clubUuid}),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', () => new NotFoundError())
      )

      if (club.validUntil < new Date()) {
        return yield* _(
          new ClubCannotBeReactivatedError({
            reactivationBlockedReason: 'PAST_VALIDITY',
          })
        )
      }

      if (club.report >= club.reportLimit) {
        return yield* _(
          new ClubCannotBeReactivatedError({
            reactivationBlockedReason: 'REPORT_LIMIT_REACHED',
          })
        )
      }

      yield* _(clubsDb.updateReactivateClub({clubUuid: club.uuid}))
      const reactivatedClub = yield* _(
        clubsDb.findClubAdminByUuid({uuid: club.uuid}),
        Effect.flatten,
        Effect.catchTag('NoSuchElementException', () => new NotFoundError())
      )

      return {clubInfo: clubDbRecordToClubAdminInfo(reactivatedClub)}
    }).pipe(makeEndpointEffect)
)
