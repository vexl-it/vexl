import {
  aesCTRDecrypt,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema, type ParseResult} from 'effect/index'
import {Session} from '../../../brands/Session.brand'
import {
  getItemFromAsyncStorage,
  getItemFromSecretStorage,
  saveItemToSecretStorage,
  type ErrorReadingFromAsyncStorage,
  type ErrorReadingFromSecureStorage,
  type ErrorWritingToStore,
  type StoreEmpty,
} from '../../../utils/fpUtils'
import {SECRET_TOKEN_KEY_V2_OPTIONS} from './writeSessionToStorage'

function getSecretToken({
  secretStorageKey,
  secretStorageKeyV2,
}: {
  secretStorageKey: string
  secretStorageKeyV2: string
}): Effect.Effect<
  string,
  StoreEmpty | ErrorReadingFromSecureStorage | ErrorWritingToStore
> {
  return getItemFromSecretStorage(secretStorageKeyV2).pipe(
    Effect.catchTag('StoreEmpty', () =>
      getItemFromSecretStorage(secretStorageKey).pipe(
        Effect.tap((secretToken) =>
          saveItemToSecretStorage(
            secretStorageKeyV2,
            SECRET_TOKEN_KEY_V2_OPTIONS
          )(secretToken)
        )
      )
    )
  )
}

export function readSessionFromStorage({
  asyncStorageKey,
  secretStorageKey,
  secretStorageKeyV2,
}: {
  asyncStorageKey: string
  secretStorageKey: string
  secretStorageKeyV2: string
}): Effect.Effect<
  Session,
  | StoreEmpty
  | ErrorReadingFromSecureStorage
  | ErrorReadingFromAsyncStorage
  | ErrorWritingToStore
  | CryptoError
  | ParseResult.ParseError
> {
  return Effect.gen(function* (_) {
    const encryptedSessionJson = yield* _(
      getItemFromAsyncStorage(asyncStorageKey)
    )
    const secretToken = yield* _(
      getSecretToken({secretStorageKey, secretStorageKeyV2})
    )

    return yield* _(
      aesCTRDecrypt(secretToken)(encryptedSessionJson),
      Effect.flatMap(Schema.decode(Schema.parseJson(Session)))
    )
  })
}
