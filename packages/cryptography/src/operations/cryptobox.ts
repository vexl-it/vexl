import {Schema} from 'effect'
import sodium from 'libsodium-wrappers'
import {
  KeyPairV2,
  PRIVATE_KEY_V2_PREFIX,
  type PrivateKeyV2,
  PUBLIC_KEY_V2_PREFIX,
  PublicKeyV2,
} from '../KeyHolder/brandsV2'

/**
 * Version prefix for cryptobox sealed messages.
 * "1." indicates version 1 = libsodium crypto_box_seal
 */

/**
 * Error thrown when decryption fails (wrong key, corrupted data, etc.)
 */
export class CryptoboxDecryptionError extends Error {
  readonly _tag = 'CryptoboxDecryptionError'
  constructor(message: string) {
    super(message)
    this.name = 'CryptoboxDecryptionError'
  }
}

/**
 * Error thrown when version format is invalid or unsupported
 */
export class CryptoboxVersionError extends Error {
  readonly _tag = 'CryptoboxVersionError'
  constructor(message: string) {
    super(message)
    this.name = 'CryptoboxVersionError'
  }
}

/**
 * Ensures libsodium is initialized before use.
 * Must be called before any crypto operations.
 */
async function ensureSodiumReady(): Promise<void> {
  await sodium.ready
}

function privateKeyToCurve25519(privateKeyV2: PrivateKeyV2): Uint8Array {
  const ed25519PrivateKey = Buffer.from(
    privateKeyV2.slice(PRIVATE_KEY_V2_PREFIX.length),
    'base64url'
  )
  return sodium.crypto_sign_ed25519_sk_to_curve25519(ed25519PrivateKey)
}

function publicKeyToCurve25519(publicKeyV2: PublicKeyV2): Uint8Array {
  const ed25519PublicKey = Buffer.from(
    publicKeyV2.slice(PUBLIC_KEY_V2_PREFIX.length),
    'base64url'
  )
  return sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519PublicKey)
}

export async function generateKeyPair(): Promise<KeyPairV2> {
  await ensureSodiumReady()

  const keypair = sodium.crypto_sign_keypair()

  const publicKey = `${PUBLIC_KEY_V2_PREFIX}${sodium.to_base64(keypair.publicKey)}`
  const privateKey = `${
    PRIVATE_KEY_V2_PREFIX
  }${sodium.to_base64(keypair.privateKey)}`

  return Schema.decodeSync(KeyPairV2)({
    publicKey,
    privateKey,
  })
}

export async function derivePubKey(
  privateKey: PrivateKeyV2
): Promise<PublicKeyV2> {
  await sodium.ready

  const privateKeyBytes = sodium.from_base64(privateKey)
  // Public key is the last crypto_sign_PUBLICKEYBYTES (32) bytes of the secret key
  const publicKeyBytes = privateKeyBytes.slice(
    -sodium.crypto_sign_PUBLICKEYBYTES
  )

  return Schema.decodeSync(PublicKeyV2)(
    `${PUBLIC_KEY_V2_PREFIX}${sodium.to_base64(publicKeyBytes)}`
  )
}

export async function seal(
  message: string,
  recipientPublicKey: PublicKeyV2
): Promise<string> {
  await ensureSodiumReady()

  const publicKeyForSigning = publicKeyToCurve25519(recipientPublicKey)

  // Encode message as UTF-8
  const messageBuffer = sodium.from_string(message)

  const ciphertext = sodium.crypto_box_seal(messageBuffer, publicKeyForSigning)

  const ciphertextBase64 = sodium.to_base64(ciphertext)

  return ciphertextBase64
}

/**
 * Decrypts a message encrypted with seal().
 *
 * @param ciphertext - Versioned ciphertext ("1." + base64url sealed box)
 * @param keypair - Recipient's keypair
 * @returns Decrypted plaintext message
 * @throws CryptoboxVersionError if version prefix is missing or unsupported
 * @throws CryptoboxDecryptionError if decryption fails (wrong key, corrupted data)
 */
export async function unseal(
  ciphertext: string,
  keypair: KeyPairV2
): Promise<string> {
  await ensureSodiumReady()

  try {
    // Decode from base64
    const ciphertextBuffer = sodium.from_base64(ciphertext)

    // Decode keypair
    const publicKeyBuffer = publicKeyToCurve25519(keypair.publicKey)
    const privateKeyBuffer = privateKeyToCurve25519(keypair.privateKey)

    // Decrypt using crypto_box_seal_open
    const plaintext = sodium.crypto_box_seal_open(
      ciphertextBuffer,
      publicKeyBuffer,
      privateKeyBuffer
    )

    // Return as UTF-8 string
    return sodium.to_string(plaintext)
  } catch {
    throw new CryptoboxDecryptionError(
      'Decryption failed: invalid ciphertext or wrong key'
    )
  }
}

export async function sign(
  message: string,
  privateKey: PrivateKeyV2
): Promise<string> {
  await ensureSodiumReady()

  return sodium.crypto_sign_detached(
    message,
    sodium.from_base64(privateKey.slice(PRIVATE_KEY_V2_PREFIX.length)),
    'base64'
  )
}

export async function verifySignature(
  message: string,
  signature: string,
  publicKey: PublicKeyV2
): Promise<boolean> {
  await ensureSodiumReady()

  return sodium.crypto_sign_verify_detached(
    sodium.from_base64(signature),
    message,
    sodium.from_base64(publicKey.slice(PUBLIC_KEY_V2_PREFIX.length))
  )
}
