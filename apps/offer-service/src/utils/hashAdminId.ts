import {Schema} from '@effect/schema'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
import {aesEncrpytE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, type ConfigError} from 'effect'
import {easKey} from '../configs'
import {OfferAdminIdHashed} from '../db/OfferDbService/domain'

const brandOfferAdminIdHashed = Schema.decodeSync(OfferAdminIdHashed)

export const hashAdminId = (
  adminId: OfferAdminId
): Effect.Effect<
  OfferAdminIdHashed,
  UnexpectedServerError | ConfigError.ConfigError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const key = yield* _(easKey)
    const encrypt = aesEncrpytE(key, true)

    return yield* _(
      encrypt(adminId),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error while hashing adminid', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.map(brandOfferAdminIdHashed)
    )
  })
