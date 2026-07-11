import {Array, pipe, Schema} from 'effect'
import sodium from 'libsodium-wrappers'

/**
 * Error thrown when the current libsodium binding is missing functions
 * required by the device-migration protocol. Contains ONLY the missing
 * function names — never any key material or migration metadata.
 */
export class MigrationCryptoUnsupportedError extends Schema.TaggedError<MigrationCryptoUnsupportedError>(
  'MigrationCryptoUnsupportedError'
)('MigrationCryptoUnsupportedError', {
  missingFunctions: Schema.Array(Schema.String),
}) {}

const REQUIRED_FUNCTION_NAMES: readonly string[] = [
  'crypto_kx_keypair',
  'crypto_kx_client_session_keys',
  'crypto_kx_server_session_keys',
  'crypto_secretstream_xchacha20poly1305_init_push',
  'crypto_secretstream_xchacha20poly1305_push',
  'crypto_secretstream_xchacha20poly1305_init_pull',
  'crypto_secretstream_xchacha20poly1305_pull',
  'crypto_auth',
  'crypto_auth_verify',
  'crypto_kdf_derive_from_key',
  'randombytes_buf',
]

/**
 * Returns the names from REQUIRED_FUNCTION_NAMES whose value in the given
 * record is not a function. Exported for tests; production code should call
 * assertMigrationCryptoSupported.
 */
export function listMissingMigrationCryptoFunctions(
  api: Partial<Record<string, unknown>>
): readonly string[] {
  return pipe(
    REQUIRED_FUNCTION_NAMES,
    Array.filter((name) => typeof api[name] !== 'function')
  )
}

/**
 * Runtime check that every libsodium function required by the migration
 * protocol exists on the active binding.
 *
 * This MUST be called on device before pairing starts: on device Metro
 * aliases libsodium-wrappers to react-native-libsodium, which implements
 * only a subset of libsodium. Jest runs against the full wasm implementation,
 * so passing tests prove nothing about device availability.
 *
 * @throws MigrationCryptoUnsupportedError listing the missing function names.
 */
export async function assertMigrationCryptoSupported(): Promise<void> {
  await sodium.ready

  const missingFunctions = listMissingMigrationCryptoFunctions({
    crypto_kx_keypair: sodium.crypto_kx_keypair,
    crypto_kx_client_session_keys: sodium.crypto_kx_client_session_keys,
    crypto_kx_server_session_keys: sodium.crypto_kx_server_session_keys,
    crypto_secretstream_xchacha20poly1305_init_push:
      sodium.crypto_secretstream_xchacha20poly1305_init_push,
    crypto_secretstream_xchacha20poly1305_push:
      sodium.crypto_secretstream_xchacha20poly1305_push,
    crypto_secretstream_xchacha20poly1305_init_pull:
      sodium.crypto_secretstream_xchacha20poly1305_init_pull,
    crypto_secretstream_xchacha20poly1305_pull:
      sodium.crypto_secretstream_xchacha20poly1305_pull,
    crypto_auth: sodium.crypto_auth,
    crypto_auth_verify: sodium.crypto_auth_verify,
    crypto_kdf_derive_from_key: sodium.crypto_kdf_derive_from_key,
    randombytes_buf: sodium.randombytes_buf,
  })

  if (Array.isNonEmptyReadonlyArray(missingFunctions)) {
    throw new MigrationCryptoUnsupportedError({missingFunctions})
  }
}
