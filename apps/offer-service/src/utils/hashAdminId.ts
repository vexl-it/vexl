import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type OfferAdminId} from '@vexl-next/domain/src/general/offers'
import {aesEncrpytE} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, pipe, Schema, type Config} from 'effect'
import {easKey} from '../configs'
import {OfferAdminIdHashed} from '../db/OfferDbService/domain'

const brandOfferAdminIdHashed = Schema.decodeSync(OfferAdminIdHashed)

export const hashAdminId = (
  adminId: OfferAdminId
): Effect.Effect<
  OfferAdminIdHashed,
  UnexpectedServerError | Config.ConfigError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const key = yield* easKey
    const encrypt = aesEncrpytE(key, true)

    return yield* pipe(
      encrypt(adminId),
      Effect.catch((e) =>
        Effect.andThen(
          Effect.logError('Error while hashing adminid', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.map(brandOfferAdminIdHashed)
    )
  })
