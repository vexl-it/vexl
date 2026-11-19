import {HttpApiBuilder} from '@effect/platform/index'
import {NotFoundError} from '@vexl-next/domain/src/general/commonErrors'
import {ContactInternalApiSpecification} from '@vexl-next/rest-api/src/services/contact/internalSpecification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {BannedNumberDbService} from '../../db/BannedNumberDbService'

export const deleteBannedNumber = HttpApiBuilder.handler(
  ContactInternalApiSpecification,
  'BannedNumbersAdmin',
  'deleteBannedNumber',
  (req) =>
    Effect.gen(function* (_) {
      const bannedNumberDb = yield* _(BannedNumberDbService)

      const deleted = yield* _(bannedNumberDb.deleteBannedNumber(req.path.id))
      if (!deleted) return yield* _(new NotFoundError())
    }).pipe(makeEndpointEffect)
)
