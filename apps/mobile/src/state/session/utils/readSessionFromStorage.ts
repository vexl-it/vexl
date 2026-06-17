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
  type StoreEmpty,
} from '../../../utils/fpUtils'
import {markV2SecretAsWritten, wasV2SecretWritten} from './v2SecretStorageFlag'
import {SECRET_TOKEN_KEY_V2_OPTIONS} from './writeSessionToStorage'

export class V2SecretReadFailedAfterBeingWritten extends Schema.TaggedError<V2SecretReadFailedAfterBeingWritten>(
  'V2SecretReadFailedAfterBeingWritten'
)('V2SecretReadFailedAfterBeingWritten', {
  cause: Schema.Unknown,
}) {}

export class StoredSessionSecretUnavailable extends Schema.TaggedError<StoredSessionSecretUnavailable>(
  'StoredSessionSecretUnavailable'
)('StoredSessionSecretUnavailable', {
  cause: Schema.Unknown,
}) {}

function mapV2SecretReadError(
  loadingError: StoreEmpty | ErrorReadingFromSecureStorage
):
  | StoreEmpty
  | V2SecretReadFailedAfterBeingWritten
  | ErrorReadingFromSecureStorage {
  if (
    loadingError._tag === 'ErrorReadingFromSecureStorage' &&
    wasV2SecretWritten()
  ) {
    return new V2SecretReadFailedAfterBeingWritten({cause: loadingError})
  }

  return loadingError
}

function mapLegacySecretReadError(
  loadingError: StoreEmpty | ErrorReadingFromSecureStorage
): StoredSessionSecretUnavailable | ErrorReadingFromSecureStorage {
  if (loadingError._tag === 'StoreEmpty') {
    return new StoredSessionSecretUnavailable({cause: loadingError})
  }

  return loadingError
}

function getSecretToken({
  secretStorageKey,
  secretStorageKeyV2,
}: {
  secretStorageKey: string
  secretStorageKeyV2: string
}): Effect.Effect<
  string,
  | StoreEmpty
  | V2SecretReadFailedAfterBeingWritten
  | StoredSessionSecretUnavailable
  | ErrorReadingFromSecureStorage
> {
  return getItemFromSecretStorage(secretStorageKeyV2).pipe(
    Effect.mapError(mapV2SecretReadError),
    Effect.catchTag('StoreEmpty', () =>
      getItemFromSecretStorage(secretStorageKey).pipe(
        Effect.mapError(mapLegacySecretReadError),
        Effect.tap((secretToken) =>
          saveItemToSecretStorage(
            secretStorageKeyV2,
            SECRET_TOKEN_KEY_V2_OPTIONS
          )(secretToken).pipe(
            Effect.tap(() => Effect.sync(markV2SecretAsWritten)),
            Effect.ignore
          )
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
  | V2SecretReadFailedAfterBeingWritten
  | StoredSessionSecretUnavailable
  | ErrorReadingFromSecureStorage
  | ErrorReadingFromAsyncStorage
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
