import AsyncStorage from '@react-native-async-storage/async-storage'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Effect} from 'effect'
import * as SecretStore from 'expo-secure-store'
import {
  clearV2SecretWasWrittenFlag,
  wasV2SecretWritten,
} from './v2SecretStorageFlag'
import {
  SECRET_TOKEN_KEY,
  SECRET_TOKEN_KEY_V2,
  SESSION_KEY,
} from './writeSessionToStorage'

/**
 * Awaited, read-back-verified session storage deletion for device migration
 * (source retirement steps 4–5 in spec section "Source local retirement",
 * and the destination's authenticated safe-cancellation cleanup).
 *
 * Deliberately NOT `sessionAtom(O.none)` / `logoutActionAtom`: those delete
 * fire-and-forget (unacceptable for retirement — a crash could leave the
 * session recoverable) and logout additionally deletes remote server state,
 * which migration must never touch.
 *
 * Deletes and verifies as absent:
 *
 * - the AsyncStorage encrypted session (`session`);
 * - the current SecureStore session secret (`secretToken_V2`);
 * - the legacy SecureStore session secret (`secretToken`);
 * - the device-local `session:v2SecretWasWritten` marker.
 *
 * Idempotent — already-absent values verify successfully. Fails with
 * `DeviceMigrationError('cleanupIncomplete')` when any value cannot be
 * proven absent; the caller must retry until it succeeds.
 */
export function deleteSessionFromStorageVerified(): Effect.Effect<
  void,
  DeviceMigrationError
> {
  return Effect.tryPromise({
    try: async () => {
      await AsyncStorage.removeItem(SESSION_KEY)
      await SecretStore.deleteItemAsync(SECRET_TOKEN_KEY_V2)
      await SecretStore.deleteItemAsync(SECRET_TOKEN_KEY)
      clearV2SecretWasWrittenFlag()

      const sessionReadBack = await AsyncStorage.getItem(SESSION_KEY)
      if (sessionReadBack !== null) throw new Error('session still present')
      const v2SecretReadBack =
        await SecretStore.getItemAsync(SECRET_TOKEN_KEY_V2)
      if (v2SecretReadBack !== null) throw new Error('secret still present')
      const legacySecretReadBack =
        await SecretStore.getItemAsync(SECRET_TOKEN_KEY)
      if (legacySecretReadBack !== null)
        throw new Error('legacy secret still present')
      if (wasV2SecretWritten()) throw new Error('marker still present')
    },
    catch: () => new DeviceMigrationError({code: 'cleanupIncomplete'}),
  })
}
