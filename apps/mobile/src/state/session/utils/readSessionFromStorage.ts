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

type SecretTokenSource = 'v2' | 'legacy'

interface SecretTokenFromStorage {
  readonly secretToken: string
  readonly source: SecretTokenSource
}

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

function secretTokenFromStorage(
  source: SecretTokenSource,
  secretToken: string
): SecretTokenFromStorage {
  return {secretToken, source}
}

function getLegacySecretToken({
  secretStorageKey,
}: {
  secretStorageKey: string
}): Effect.Effect<
  SecretTokenFromStorage,
  StoredSessionSecretUnavailable | ErrorReadingFromSecureStorage
> {
  return getItemFromSecretStorage(secretStorageKey).pipe(
    Effect.mapError(mapLegacySecretReadError),
    Effect.map((secretToken) => secretTokenFromStorage('legacy', secretToken))
  )
}

function getPreferredSecretToken({
  secretStorageKey,
  secretStorageKeyV2,
}: {
  secretStorageKey: string
  secretStorageKeyV2: string
}): Effect.Effect<
  SecretTokenFromStorage,
  | StoreEmpty
  | V2SecretReadFailedAfterBeingWritten
  | StoredSessionSecretUnavailable
  | ErrorReadingFromSecureStorage
> {
  return getItemFromSecretStorage(secretStorageKeyV2).pipe(
    Effect.mapError(mapV2SecretReadError),
    Effect.map((secretToken) => secretTokenFromStorage('v2', secretToken)),
    Effect.catchTag('StoreEmpty', () =>
      getLegacySecretToken({
        secretStorageKey,
      })
    )
  )
}

function backfillV2SecretIfNeeded({
  secretStorageKeyV2,
  secretTokenFromStorage,
}: {
  secretStorageKeyV2: string
  secretTokenFromStorage: SecretTokenFromStorage
}): Effect.Effect<void> {
  if (secretTokenFromStorage.source === 'v2') return Effect.void

  return saveItemToSecretStorage(
    secretStorageKeyV2,
    SECRET_TOKEN_KEY_V2_OPTIONS
  )(secretTokenFromStorage.secretToken).pipe(
    Effect.tap(() => Effect.sync(markV2SecretAsWritten)),
    Effect.ignore
  )
}

function decryptAndDecodeSession(
  encryptedSessionJson: string,
  secretToken: string
): Effect.Effect<Session, CryptoError | ParseResult.ParseError> {
  return aesCTRDecrypt(secretToken)(encryptedSessionJson).pipe(
    Effect.flatMap(Schema.decode(Schema.parseJson(Session)))
  )
}

function decryptWithLegacySecretOrOriginalError({
  encryptedSessionJson,
  secretStorageKey,
  secretStorageKeyV2,
  originalError,
}: {
  encryptedSessionJson: string
  secretStorageKey: string
  secretStorageKeyV2: string
  originalError: CryptoError | ParseResult.ParseError
}): Effect.Effect<Session, CryptoError | ParseResult.ParseError> {
  return getLegacySecretToken({secretStorageKey}).pipe(
    Effect.flatMap((secretTokenFromStorage) =>
      decryptAndDecodeSession(
        encryptedSessionJson,
        secretTokenFromStorage.secretToken
      ).pipe(
        Effect.tap(() =>
          backfillV2SecretIfNeeded({
            secretStorageKeyV2,
            secretTokenFromStorage,
          })
        )
      )
    ),
    Effect.catchAll(() => Effect.fail(originalError))
  )
}

function decryptAndDecodeSessionWithFallback({
  encryptedSessionJson,
  secretStorageKey,
  secretStorageKeyV2,
  secretTokenFromStorage,
}: {
  encryptedSessionJson: string
  secretStorageKey: string
  secretStorageKeyV2: string
  secretTokenFromStorage: SecretTokenFromStorage
}): Effect.Effect<Session, CryptoError | ParseResult.ParseError> {
  return decryptAndDecodeSession(
    encryptedSessionJson,
    secretTokenFromStorage.secretToken
  ).pipe(
    Effect.tap(() =>
      backfillV2SecretIfNeeded({secretStorageKeyV2, secretTokenFromStorage})
    ),
    Effect.catchAll((e) =>
      secretTokenFromStorage.source === 'v2'
        ? decryptWithLegacySecretOrOriginalError({
            encryptedSessionJson,
            secretStorageKey,
            secretStorageKeyV2,
            originalError: e,
          })
        : Effect.fail(e)
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
    const secretTokenFromStorage = yield* _(
      getPreferredSecretToken({secretStorageKey, secretStorageKeyV2})
    )

    return yield* _(
      decryptAndDecodeSessionWithFallback({
        encryptedSessionJson,
        secretStorageKey,
        secretStorageKeyV2,
        secretTokenFromStorage,
      })
    )
  })
}
