import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  SERVER_TO_CLIENT_HASHED_NUMBER_PREFIX,
  ServerToClientHashedNumber,
} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {pbkdf2} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ConfigError, Effect, pipe, Schema, String} from 'effect/index'
import {secretSaltForServerContact} from '../configs'

export const SERVER_HASH_PREFIX = 'ServerHash:'

export const ServerHashedNumber = Schema.String.pipe(
  Schema.filter(String.startsWith(SERVER_HASH_PREFIX)),
  Schema.brand('ServerHashedNumber')
)
export type ServerHashedNumber = typeof ServerHashedNumber.Type

export const serverHashPhoneNumber = (
  hashedPhoneNumber: HashedPhoneNumber
): Effect.Effect<
  ServerHashedNumber,
  ConfigError.ConfigError | UnexpectedServerError
> =>
  Effect.zipRight(
    // If the hashed phone number already starts with the server hash prefix, we should not hash it again
    String.startsWith(SERVER_HASH_PREFIX)(hashedPhoneNumber)
      ? Effect.fail(
          new UnexpectedServerError({
            message: `Hashed phone number is already a server hashed contact ${hashedPhoneNumber}`,
          })
        )
      : Effect.void,
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
