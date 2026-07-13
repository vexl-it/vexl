import AsyncStorage from '@react-native-async-storage/async-storage'
import {generateRandomBase64Url} from '@vexl-next/cryptography/src/operations/deviceMigration/randomBytes'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {aesCTREncrypt} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect} from 'effect'
import * as SecretStore from 'expo-secure-store'
import {markV2SecretAsWritten} from './v2SecretStorageFlag'
import {
  SECRET_TOKEN_KEY_V2,
  SECRET_TOKEN_KEY_V2_OPTIONS,
  SESSION_KEY,
} from './writeSessionToStorage'

/**
 * Migration-specific transactional session install (spec section "Logical
 * session"). Deliberately NOT `writeSessionToStorage`:
 *
 * - The ordinary writer persists AsyncStorage BEFORE SecureStore, so a crash
 *   in between leaves an encrypted session without its secret. The installer
 *   inverts the order: the SecureStore secret is written (and read-back
 *   verified) FIRST, and the AsyncStorage encrypted session is written LAST
 *   as the commit marker — a crash in between leaves an orphaned secret that
 *   the idempotent install simply overwrites on retry.
 * - A FRESH random destination-local encryption secret is generated for
 *   every install instead of reusing key material from the source device.
 *   `readSessionFromStorage` uses the stored SecureStore value as the AES
 *   password directly, so any password string works; ordinary session
 *   rewrites after activation converge back to the app's usual secret.
 *
 * The caller (snapshot installer) must have URI-denormalized and
 * schema-validated `sessionJson` already.
 *
 * PRIVACY: session bytes and secrets must never reach
 * reportError/Sentry/console. Every failure surfaces as
 * `DeviceMigrationError` with an enumerated code only.
 */

const SESSION_SECRET_RANDOM_BYTES = 32

export function installMigratedSessionToStorage(args: {
  readonly sessionJson: string
}): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    // 1. Fresh random destination-local session encryption secret.
    const sessionSecret = yield* _(
      Effect.tryPromise({
        try: async () =>
          await generateRandomBase64Url(SESSION_SECRET_RANDOM_BYTES),
        catch: () => new DeviceMigrationError({code: 'sessionInvalid'}),
      })
    )

    // 2. Encrypt the logical session with the fresh secret.
    const encryptedSessionJson = yield* _(
      aesCTREncrypt(sessionSecret)(args.sessionJson).pipe(
        Effect.mapError(
          () => new DeviceMigrationError({code: 'sessionInvalid'})
        )
      )
    )

    // 3. SecureStore secret FIRST, read-back verified.
    yield* _(
      Effect.tryPromise({
        try: async () => {
          await SecretStore.setItemAsync(
            SECRET_TOKEN_KEY_V2,
            sessionSecret,
            SECRET_TOKEN_KEY_V2_OPTIONS
          )
          const readBack = await SecretStore.getItemAsync(
            SECRET_TOKEN_KEY_V2,
            SECRET_TOKEN_KEY_V2_OPTIONS
          )
          if (readBack !== sessionSecret) throw new Error('read-back mismatch')
        },
        catch: () => new DeviceMigrationError({code: 'stateInvalid'}),
      })
    )

    // 4. Device-local diagnostic marker that the V2 secret exists on THIS
    //    device.
    yield* _(Effect.sync(markV2SecretAsWritten))

    // 5. AsyncStorage encrypted session LAST — the account-data commit
    //    marker, read-back verified.
    yield* _(
      Effect.tryPromise({
        try: async () => {
          await AsyncStorage.setItem(SESSION_KEY, encryptedSessionJson)
          const readBack = await AsyncStorage.getItem(SESSION_KEY)
          if (readBack !== encryptedSessionJson)
            throw new Error('read-back mismatch')
        },
        catch: () => new DeviceMigrationError({code: 'stateInvalid'}),
      })
    )
  })
}
