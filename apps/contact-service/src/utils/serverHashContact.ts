import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type ContactHash} from '@vexl-next/domain/src/general/ContactHash.brand'
import {
  SERVER_TO_CLIENT_HASHED_NUMBER_PREFIX,
  ServerToClientHashedNumber,
} from '@vexl-next/domain/src/general/ServerToClientHashedNumber'
import {pbkdf2} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ConfigError, Effect, pipe, Schema, String} from 'effect/index'
import {secretSaltForServerContact} from '../configs'

const SERVER_HASH_PREFIX = 'ServerHash:'

export const ServerHashedNumber = Schema.String.pipe(
  Schema.filter(String.startsWith(SERVER_HASH_PREFIX)),
  Schema.brand('ServerHashedNumber')
)
export type ServerHashedNumber = typeof ServerHashedNumber.Type

export const serverHashContact = (
  contactHash: ContactHash
): Effect.Effect<
  ServerHashedNumber,
  ConfigError.ConfigError | UnexpectedServerError
> =>
  Effect.zipRight(
    // If the contact hash already starts with the server hash prefix, we should not hash it again
    String.startsWith(SERVER_HASH_PREFIX)(contactHash)
      ? Effect.fail(
          new UnexpectedServerError({
            message: `Contact hash is already a server hashed contact ${contactHash}`,
          })
        )
      : Effect.void,
    secretSaltForServerContact.pipe(
      Effect.flatMap((salt) =>
        pbkdf2({
          password: contactHash,
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
            message: `Error server-hashing contact: ${e.message}`,
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
