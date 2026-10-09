import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {internalServerPortConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {makeInternalApiServer} from '@vexl-next/server-utils/src/InternalServer'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Layer} from 'effect'
import {createClub} from '../routes/clubs/admin/createClub'
import {generateClubInviteLink} from '../routes/clubs/admin/generateClubInviteLink'
import {getClubStats} from '../routes/clubs/admin/getClubStats'
import {listClubs} from '../routes/clubs/admin/listClubs'
import {modifyClub} from '../routes/clubs/admin/modifyClub'
import {reactivateClub} from '../routes/clubs/admin/reactivateClub'
import {requestClubImageUpload} from '../routes/clubs/admin/requestClubImageUpload'
import {validateAdminToken} from '../routes/clubs/utils/validateAdminToken'
import {testHasingSpeed} from './routes/testHashingSpeed'

const ClubsAdminApiGroupLive = HttpApiBuilder.group(
  ContactInternalApiSpecification,
  'ClubsAdmin',
  (h) =>
    h
      .handle('createClub', createClub)
      .handle('modifyClub', modifyClub)
      .handle('generateClubInviteLinkForAdmin', generateClubInviteLink)
      .handle('listClubs', listClubs)
      .handle('getClubStats', getClubStats)
      .handle('reactivateClub', reactivateClub)
      .handle('requestClubImageUpload', requestClubImageUpload)
)

const DebugApiGroupLive = HttpApiBuilder.group(
  ContactInternalApiSpecification,
  'Debug',
  (h) =>
    h.handle('testHashingSpeed', (req) =>
      Effect.gen(function* (_) {
        yield* _(validateAdminToken(req.headers[HEADER_ADMIN_TOKEN]))

        const durationMs = yield* _(
          testHasingSpeed(req.payload.iterations, req.payload.numberOfElements),
          Effect.mapError(
            (cause) => new UnexpectedServerError({status: 500, cause})
          )
        )
        return {durationMs}
      }).pipe(makeEndpointEffect)
    )
)

export const ContactInternalApiLive = HttpApiBuilder.api(
  ContactInternalApiSpecification
).pipe(Layer.provide(ClubsAdminApiGroupLive), Layer.provide(DebugApiGroupLive))

export const internalServerLive = makeInternalApiServer(
  ContactInternalApiLive,
  {port: internalServerPortConfig}
)
