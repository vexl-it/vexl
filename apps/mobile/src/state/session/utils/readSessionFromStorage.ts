import {
  aesCTRDecrypt,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Option, Schema, type ParseResult} from 'effect/index'
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
import {
  SECRET_TOKEN_KEY,
  SECRET_TOKEN_KEY_V2,
  SECRET_TOKEN_KEY_V2_OPTIONS,
  SESSION_KEY,
} from './writeSessionToStorage'

// The session sits AES-encrypted in AsyncStorage under SESSION_KEY. The
// secret that decrypts it lives in SecureStore, in one of two slots:
//
// - SECRET_TOKEN_KEY_V2 - preferred; written with AFTER_FIRST_UNLOCK options
//   so background launches can read it before the first device unlock.
// - SECRET_TOKEN_KEY - the legacy slot older app versions wrote with default
//   (WHEN_UNLOCKED) options. Read only when the V2 slot is empty or holds a
//   secret that can't decrypt the session. Whenever the legacy secret is the
//   one that works, it is copied into the V2 slot (best-effort) so the next
//   launch finds it there.

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

function readV2Secret(): Effect.Effect<
  Option.Option<string>,
  V2SecretReadFailedAfterBeingWritten | ErrorReadingFromSecureStorage
> {
  return getItemFromSecretStorage(SECRET_TOKEN_KEY_V2).pipe(
    Effect.map(Option.some),
    Effect.catchTag('StoreEmpty', () => Effect.succeed(Option.none())),
    Effect.mapError((e) =>
      // A read failure on a secret we know was written is a locked/corrupted
      // keychain, not a device that never migrated - report it distinctly so
      // it can never be misread as "logged out".
      wasV2SecretWritten()
        ? new V2SecretReadFailedAfterBeingWritten({cause: e})
        : e
    )
  )
}

function readLegacySecret(): Effect.Effect<
  string,
  StoredSessionSecretUnavailable | ErrorReadingFromSecureStorage
> {
  return getItemFromSecretStorage(SECRET_TOKEN_KEY).pipe(
    Effect.catchTag('StoreEmpty', (e) =>
      // An encrypted session exists but no secret is stored anywhere: this
      // must block with the recovery screen, not route the user to login.
      Effect.fail(new StoredSessionSecretUnavailable({cause: e}))
    )
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

function writeSecretToV2Slot(secretToken: string): Effect.Effect<void> {
  // Best-effort: a failed write must never block a login that already has a
  // working secret. The marker flag is only set once the write succeeded.
  return saveItemToSecretStorage(
    SECRET_TOKEN_KEY_V2,
    SECRET_TOKEN_KEY_V2_OPTIONS
  )(secretToken).pipe(
    Effect.tap(() => Effect.sync(markV2SecretAsWritten)),
    Effect.ignore
  )
}

function decryptWithLegacySecretAndMigrateToV2(
  encryptedSessionJson: string
): Effect.Effect<
  Session,
  | StoredSessionSecretUnavailable
  | ErrorReadingFromSecureStorage
  | CryptoError
  | ParseResult.ParseError
> {
  return Effect.gen(function* () {
    const legacySecret = yield* readLegacySecret()
    const session = yield* decryptAndDecodeSession(
      encryptedSessionJson,
      legacySecret
    )
    yield* writeSecretToV2Slot(legacySecret)
    return session
  })
}

export function readSessionFromStorage(): Effect.Effect<
  Session,
  | StoreEmpty
  | V2SecretReadFailedAfterBeingWritten
  | StoredSessionSecretUnavailable
  | ErrorReadingFromSecureStorage
  | ErrorReadingFromAsyncStorage
  | CryptoError
  | ParseResult.ParseError
> {
  return Effect.gen(function* () {
    const encryptedSessionJson = yield* getItemFromAsyncStorage(SESSION_KEY)

    const v2Secret = yield* readV2Secret()

    // The V2 slot was never written (device coming from a pre-V2 app
    // version): decrypt with the legacy secret and migrate it.
    if (Option.isNone(v2Secret))
      return yield* decryptWithLegacySecretAndMigrateToV2(encryptedSessionJson)

    return yield* decryptAndDecodeSession(
      encryptedSessionJson,
      v2Secret.value
    ).pipe(
      Effect.catchAll((v2DecryptError) =>
        // The V2 slot holds a secret that can't decrypt the session - a stale
        // copy (e.g. from an interrupted past write). Rescue with the legacy
        // secret, overwriting the stale copy on success; if the rescue fails
        // too, surface the V2 attempt's error.
        decryptWithLegacySecretAndMigrateToV2(encryptedSessionJson).pipe(
          Effect.catchAll(() => Effect.fail(v2DecryptError))
        )
      )
    )
  })
}
