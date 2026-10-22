import {type KeyPairV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {generateKeyPairFromSeed} from '@vexl-next/cryptography/src/operations/cryptobox'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type ConfigError, Effect, Redacted} from 'effect'
import {createHmac} from 'node:crypto'
import {backupHmacKeyConfig} from '../../configs'

export const deriveBackupKeyPair = (
  phoneNumberHash: HashedPhoneNumber
): Effect.Effect<KeyPairV2, UnexpectedServerError | ConfigError.ConfigError> =>
  Effect.gen(function* (_) {
    const seed = createHmac(
      'sha256',
      Redacted.value(yield* _(backupHmacKeyConfig))
    )
      .update(phoneNumberHash)
      .digest()

    return yield* _(
      Effect.tryPromise({
        try: async () => await generateKeyPairFromSeed(seed),
        catch: (cause) =>
          new UnexpectedServerError({
            status: 500,
            message: 'Unable to derive backup key pair',
            cause,
          }),
      })
    )
  })
