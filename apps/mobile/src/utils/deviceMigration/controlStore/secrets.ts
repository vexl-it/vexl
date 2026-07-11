import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {Effect, Option} from 'effect'
import * as SecretStore from 'expo-secure-store'

/**
 * Migration secrets kept OUT of the MMKV control store: the directional
 * QR-authentication keys derived from the pairing transcript and the
 * destination staging key required for crash recovery.
 *
 * Stored in expo-secure-store under migration-specific keys with
 * THIS_DEVICE_ONLY accessibility (same rationale as
 * `SECRET_TOKEN_KEY_V2_OPTIONS` in state/session/utils/writeSessionToStorage:
 * the keys must never leave the device via iCloud Keychain or encrypted
 * backups, but must stay readable for launches before the first unlock).
 *
 * PRIVACY: secret values, keys and failures must never reach
 * reportError/Sentry/console. Every failure surfaces as
 * `DeviceMigrationError` with an enumerated code only.
 */

export type MigrationSecretName =
  /** crypto_auth key for QR MACs THIS device creates (qrMacTxKey). */
  | 'qrAuthTxKey'
  /** crypto_auth key for QR MACs THIS device verifies (qrMacRxKey). */
  | 'qrAuthRxKey'
  /** Destination staging encryption key (crash recovery of staged data). */
  | 'stagingKey'

const SECURE_STORE_KEYS: Record<MigrationSecretName, string> = {
  qrAuthTxKey: 'deviceMigration.qrAuthTxKey',
  qrAuthRxKey: 'deviceMigration.qrAuthRxKey',
  stagingKey: 'deviceMigration.stagingKey',
}

const ALL_MIGRATION_SECRET_NAMES: readonly MigrationSecretName[] = [
  'qrAuthTxKey',
  'qrAuthRxKey',
  'stagingKey',
]

export const MIGRATION_SECRET_OPTIONS: SecretStore.SecureStoreOptions = {
  // THIS_DEVICE_ONLY keeps migration secrets out of iCloud Keychain and
  // encrypted backups. AFTER_FIRST_UNLOCK keeps them readable for early-boot
  // recovery reads that can happen before the first unlock.
  keychainAccessible: SecretStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
}

/**
 * Persists one migration secret and read-back verifies the stored value.
 * Fails with `DeviceMigrationError('stateInvalid')` when the write or its
 * verification fails — a migration step must never proceed on top of an
 * unverified durable secret.
 */
export function saveMigrationSecret(
  name: MigrationSecretName
): (value: string) => Effect.Effect<void, DeviceMigrationError> {
  return (value) =>
    Effect.tryPromise({
      try: async () => {
        await SecretStore.setItemAsync(
          SECURE_STORE_KEYS[name],
          value,
          MIGRATION_SECRET_OPTIONS
        )
        const readBack = await SecretStore.getItemAsync(
          SECURE_STORE_KEYS[name],
          MIGRATION_SECRET_OPTIONS
        )
        if (readBack !== value) throw new Error('read-back mismatch')
      },
      catch: () => new DeviceMigrationError({code: 'stateInvalid'}),
    })
}

/**
 * Loads one migration secret. `Option.none` when the secret is absent;
 * fails with `DeviceMigrationError('stateInvalid')` when the secure store
 * cannot be read at all.
 */
export function loadMigrationSecret(
  name: MigrationSecretName
): Effect.Effect<Option.Option<string>, DeviceMigrationError> {
  return Effect.tryPromise({
    try: async () =>
      await SecretStore.getItemAsync(
        SECURE_STORE_KEYS[name],
        MIGRATION_SECRET_OPTIONS
      ),
    catch: () => new DeviceMigrationError({code: 'stateInvalid'}),
  }).pipe(Effect.map(Option.fromNullable))
}

/**
 * Deletes ALL migration secrets with awaited, read-back-verified deletion
 * (fire-and-forget deletion is not acceptable here — spec section "Source
 * local retirement"). Fails with `DeviceMigrationError('cleanupIncomplete')`
 * when any secret cannot be proven absent afterwards; the caller must retry
 * until it succeeds.
 */
export function deleteMigrationSecretsVerified(): Effect.Effect<
  void,
  DeviceMigrationError
> {
  return Effect.tryPromise({
    try: async () => {
      for (const name of ALL_MIGRATION_SECRET_NAMES) {
        await SecretStore.deleteItemAsync(
          SECURE_STORE_KEYS[name],
          MIGRATION_SECRET_OPTIONS
        )
      }
      for (const name of ALL_MIGRATION_SECRET_NAMES) {
        const readBack = await SecretStore.getItemAsync(
          SECURE_STORE_KEYS[name],
          MIGRATION_SECRET_OPTIONS
        )
        if (readBack !== null) throw new Error('secret still present')
      }
    },
    catch: () => new DeviceMigrationError({code: 'cleanupIncomplete'}),
  })
}
