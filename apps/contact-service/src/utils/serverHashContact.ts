import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  SERVER_HASH_PREFIX,
  ServerHashedNumber,
} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {
  SERVER_TO_CLIENT_HASHED_NUMBER_PREFIX,
  ServerToClientHashedNumber,
} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {pbkdf2} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {hashPhoneNumber} from '@vexl-next/server-utils/src/generateUserAuthData'
import {type ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {type ConfigError, Effect, pipe, Schema} from 'effect/index'
import {secretSaltForServerContact} from '../configs'

export const serverHashPhoneNumber = (
  hashedPhoneNumber: HashedPhoneNumber
): Effect.Effect<
  ServerHashedNumber,
  ConfigError.ConfigError | UnexpectedServerError
> =>
  secretSaltForServerContact.pipe(
    Effect.flatMap((salt) =>
      pbkdf2({
        password: hashedPhoneNumber,
        salt,
        iterations: 100,
      })
    ),
    Effect.map((hash) => `${SERVER_HASH_PREFIX}${hash}`),
    Effect.map(Schema.decodeSync(ServerHashedNumber)),
    Effect.catchTag(
      'CryptoError',
      (e) =>
        new UnexpectedServerError({
          message: `Error server-hashing phone number: ${e.message}`,
          cause: e,
        })
    )
  )

/**
 * Produces the same hash that `user_contact.hash_to` holds for this number
 * when clients import it.
 */
export const serverHashE164PhoneNumber = (
  phoneNumber: E164PhoneNumber
): Effect.Effect<
  ServerHashedNumber,
  ConfigError.ConfigError | UnexpectedServerError,
  ServerCrypto
> =>
  hashPhoneNumber(phoneNumber).pipe(
    Effect.catchTag(
      'CryptoError',
      (e) =>
        new UnexpectedServerError({
          message: 'Error hashing phone number',
          cause: e,
        })
    ),
    Effect.flatMap(serverHashPhoneNumber)
  )

export const hashForClient = (
  serverHashedNumber: ServerHashedNumber
): Effect.Effect<
  ServerToClientHashedNumber,
  ConfigError.ConfigError | UnexpectedServerError
> =>
  secretSaltForServerContact.pipe(
    Effect.flatMap((salt) =>
      pbkdf2({
        password: serverHashedNumber,
        salt: `forClient:${salt}`,
        iterations: 1,
      })
    ),
    Effect.map((v) => `${SERVER_TO_CLIENT_HASHED_NUMBER_PREFIX}${v}`),
    Effect.map(Schema.decodeSync(ServerToClientHashedNumber)),
    Effect.catchTag(
      'CryptoError',
      (e) =>
        new UnexpectedServerError({
          cause: e,
          message: `Error hashing server contact for client: ${e.message}`,
        })
    )
  )

export const hashForClientBatch = (
  serverHashedNumbers: readonly ServerHashedNumber[]
): Effect.Effect<
  ServerToClientHashedNumber[],
  ConfigError.ConfigError | UnexpectedServerError
> =>
  pipe(
    serverHashedNumbers.map((serverHashedNumber) =>
      hashForClient(serverHashedNumber)
    ),
    Effect.allWith({concurrency: 'unbounded'})
  )
