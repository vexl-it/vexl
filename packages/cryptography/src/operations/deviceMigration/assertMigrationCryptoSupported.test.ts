import {
  assertMigrationCryptoSupported,
  listMissingMigrationCryptoFunctions,
  MigrationCryptoUnsupportedError,
} from './assertMigrationCryptoSupported'

describe('assertMigrationCryptoSupported', () => {
  it('resolves against the full (wasm) libsodium implementation', async () => {
    await expect(assertMigrationCryptoSupported()).resolves.toBeUndefined()
  })
})

describe('listMissingMigrationCryptoFunctions', () => {
  const noop = (): void => undefined

  const completeApi = {
    crypto_kx_keypair: noop,
    crypto_kx_client_session_keys: noop,
    crypto_kx_server_session_keys: noop,
    crypto_secretstream_xchacha20poly1305_init_push: noop,
    crypto_secretstream_xchacha20poly1305_push: noop,
    crypto_secretstream_xchacha20poly1305_init_pull: noop,
    crypto_secretstream_xchacha20poly1305_pull: noop,
    crypto_auth: noop,
    crypto_auth_verify: noop,
    crypto_kdf_derive_from_key: noop,
    randombytes_buf: noop,
  }

  it('returns an empty list when every function is present', () => {
    expect(listMissingMigrationCryptoFunctions(completeApi)).toEqual([])
  })

  it('returns every required name for an empty binding', () => {
    expect(listMissingMigrationCryptoFunctions({})).toEqual([
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
    ])
  })

  it('returns only the missing names (react-native-libsodium 1.7.0 shape)', () => {
    // react-native-libsodium 1.7.0 has crypto_auth* and crypto_kdf* and
    // randombytes_buf but is missing crypto_kx_* and crypto_secretstream_*.
    const nativeLikeApi = {
      crypto_auth: noop,
      crypto_auth_verify: noop,
      crypto_kdf_derive_from_key: noop,
      randombytes_buf: noop,
    }

    expect(listMissingMigrationCryptoFunctions(nativeLikeApi)).toEqual([
      'crypto_kx_keypair',
      'crypto_kx_client_session_keys',
      'crypto_kx_server_session_keys',
      'crypto_secretstream_xchacha20poly1305_init_push',
      'crypto_secretstream_xchacha20poly1305_push',
      'crypto_secretstream_xchacha20poly1305_init_pull',
      'crypto_secretstream_xchacha20poly1305_pull',
    ])
  })

  it('treats non-function values as missing', () => {
    expect(
      listMissingMigrationCryptoFunctions({
        ...completeApi,
        crypto_kx_keypair: 42,
      })
    ).toEqual(['crypto_kx_keypair'])
  })

  it('the error carries only the missing function names', () => {
    const error = new MigrationCryptoUnsupportedError({
      missingFunctions: ['crypto_kx_keypair'],
    })

    expect(error._tag).toBe('MigrationCryptoUnsupportedError')
    expect(error.missingFunctions).toEqual(['crypto_kx_keypair'])
  })
})
