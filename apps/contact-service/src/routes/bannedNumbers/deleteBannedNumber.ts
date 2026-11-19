import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {HEADER_ADMIN_TOKEN} from '@vexl-next/rest-api/src/constants'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {BannedNumberDbService} from '../../db/BannedNumberDbService'
import {validateAdminToken} from '../../utils/validateAdminToken'

export const deleteBannedNumber = HttpApiBuilder.handler(
  ContactInternalApiSpecification,
  'BannedNumbersAdmin',
  'deleteBannedNumber',
  (req) =>
    Effect.gen(function* (_) {
      yield* _(validateAdminToken(req.headers[HEADER_ADMIN_TOKEN]))

      const bannedNumberDb = yield* _(BannedNumberDbService)

      const deleted = yield* _(bannedNumberDb.deleteBannedNumber(req.path.id))
      if (!deleted) return yield* _(new NotFoundError())
    }).pipe(makeEndpointEffect)
)
