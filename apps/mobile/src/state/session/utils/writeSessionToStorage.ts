import {aesCTREncrypt} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema} from 'effect/index'
import * as SecretStore from 'expo-secure-store'
import {Session} from '../../../brands/Session.brand'
import {
  saveItemToAsyncStorage,
  saveItemToSecretStorage,
} from '../../../utils/fpUtils'
import {markV2SecretAsWritten} from './v2SecretStorageFlag'

export const SESSION_KEY = 'session'
export const SECRET_TOKEN_KEY = 'secretToken'
export const SECRET_TOKEN_KEY_V2 = 'secretToken_V2'
export const SECRET_TOKEN_KEY_V2_OPTIONS: SecretStore.SecureStoreOptions = {
  keychainAccessible: SecretStore.AFTER_FIRST_UNLOCK,
}

export class SessionWriteError extends Schema.TaggedError<SessionWriteError>(
  'SessionPersistenceError'
)('SessionPersistenceError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export default function writeSessionToStorage(
  session: Session
): Effect.Effect<void, SessionWriteError> {
  return Effect.gen(function* (_) {
    const sessionJson = yield* _(
      Schema.encode(Schema.parseJson(Session))(session)
    )

    const encryptedSessionJson = yield* _(
      aesCTREncrypt(session.privateKey.privateKeyPemBase64)(sessionJson)
    )

    yield* _(saveItemToAsyncStorage(SESSION_KEY)(encryptedSessionJson))
    yield* _(
      saveItemToSecretStorage(
        SECRET_TOKEN_KEY_V2,
        SECRET_TOKEN_KEY_V2_OPTIONS
      )(session.privateKey.privateKeyPemBase64)
    )
    yield* _(Effect.sync(markV2SecretAsWritten))
  }).pipe(
    Effect.mapError(
      () =>
        new SessionWriteError({message: 'Failed to write session to storage'})
    )
  )
}
