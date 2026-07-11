import {Schema} from 'effect'
import sodium from 'libsodium-wrappers'
import {
  encodeUint32Be,
  lengthPrefixed,
  readUint32Be,
  utf8Bytes,
} from './encoding'
import {createSha256} from './sha256'

/**
 * Device-migration key exchange and key derivation.
 *
 * Construction (documented for security review):
 *
 * 1. Both devices generate ephemeral X25519 key-exchange key pairs
 *    (sodium.crypto_kx_keypair). The source acts as the crypto_kx SERVER,
 *    the destination acts as the crypto_kx CLIENT.
 *
 * 2. crypto_kx produces two 32-byte directional session keys per side:
 *    - source (server):      sharedTx = source→destination,
 *                            sharedRx = destination→source
 *    - destination (client): sharedRx = source→destination,
 *                            sharedTx = destination→source
 *    so both sides hold the identical pair of directional session keys.
 *
 * 3. transcriptHash = SHA-256 over a domain-separated, length-prefixed
 *    concatenation of every pairing-transcript field (see
 *    computeTranscriptHash below). Each field is prefixed with its 4-byte
 *    big-endian byte length, so field boundaries are unambiguous. The public
 *    keys are ordered by ROLE (source key first), not by own/peer, so both
 *    sides compute the identical hash.
 *
 * 4. HMAC-based extract step mixing the transcript into key derivation:
 *      masterKey(direction) = crypto_auth(
 *        message = transcriptHash,
 *        key     = kxSessionKey(direction)
 *      )
 *    crypto_auth is HMAC-SHA512-256 with a 32-byte output, which is exactly
 *    crypto_kdf_KEYBYTES. This is an HKDF-extract-style PRF application: the
 *    kx session key is the PRF key and the transcript hash is the input, so
 *    the resulting master key is bound to BOTH the Diffie-Hellman secret and
 *    the full pairing transcript. An attacker who tampers with any transcript
 *    field (transfer id, capability, versions, keys, roles) ends up with
 *    different keys on each side and every subsequent MAC/stream fails.
 *
 * 5. Expand step (sodium.crypto_kdf_derive_from_key, BLAKE2b, 8-char
 *    contexts, subkey id 1) from each directional master key:
 *      - 'vxmgstrm' → 32-byte secretstream key for that direction
 *      - 'vxmgqrmc' → 32-byte QR-MAC (crypto_auth) key for that direction
 *      - 'vxmghucd' → human authentication code material; derived from the
 *        source→destination master key only (canonical direction, so both
 *        devices display the same code): take the first 4 bytes of the
 *        32-byte subkey as a big-endian uint32, reduce mod 1,000,000 and
 *        zero-pad to 6 digits. (The mod-10^6 reduction has a negligible
 *        ~0.02% bias; the code is a human confirmation aid, not a key.)
 */

const TRANSCRIPT_DOMAIN_TAG = 'vexl-device-migration-transcript-v1'
const SOURCE_ROLE_LABEL = 'source'
const DESTINATION_ROLE_LABEL = 'destination'

const STREAM_KEY_KDF_CONTEXT = 'vxmgstrm'
const QR_MAC_KEY_KDF_CONTEXT = 'vxmgqrmc'
const HUMAN_CODE_KDF_CONTEXT = 'vxmghucd'
const KDF_SUBKEY_ID = 1
const DERIVED_KEY_BYTES = 32

export const KX_PUBLIC_KEY_BYTES = 32
export const KX_PRIVATE_KEY_BYTES = 32

export type MigrationRole = 'source' | 'destination'

/**
 * Error thrown when key exchange or key derivation fails (invalid key sizes,
 * low-order peer public key, invalid parameters).
 */
export class MigrationKeyExchangeError extends Schema.TaggedError<MigrationKeyExchangeError>(
  'MigrationKeyExchangeError'
)('MigrationKeyExchangeError', {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

export interface MigrationKxKeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export interface DeriveMigrationKeysParams {
  role: MigrationRole
  ownKeyPair: MigrationKxKeyPair
  peerPublicKey: Uint8Array
  transferId: string
  pairingCapability: string
  protocolVersion: number
}

export interface MigrationKeys {
  /** Secretstream key for frames THIS device sends. */
  streamTxKey: Uint8Array
  /** Secretstream key for frames THIS device receives. */
  streamRxKey: Uint8Array
  /** crypto_auth key for QR MACs THIS device creates. */
  qrMacTxKey: Uint8Array
  /** crypto_auth key for QR MACs THIS device verifies. */
  qrMacRxKey: Uint8Array
  /** 6-digit zero-padded human confirmation code, identical on both devices. */
  humanAuthCode: string
  /** SHA-256 of the pairing transcript, identical on both devices. */
  transcriptHash: Uint8Array
}

/**
 * Generates an ephemeral X25519 key-exchange key pair for one migration
 * pairing attempt. Must never be reused across attempts.
 */
export async function generateEphemeralKxKeyPair(): Promise<MigrationKxKeyPair> {
  await sodium.ready
  const keyPair = sodium.crypto_kx_keypair()
  return {publicKey: keyPair.publicKey, privateKey: keyPair.privateKey}
}

function computeTranscriptHash({
  protocolVersion,
  transferId,
  sourcePublicKey,
  destinationPublicKey,
  pairingCapability,
}: {
  protocolVersion: number
  transferId: string
  sourcePublicKey: Uint8Array
  destinationPublicKey: Uint8Array
  pairingCapability: string
}): Uint8Array {
  const hash = createSha256()
  // Fixed field order; every field is 4-byte big-endian length-prefixed.
  hash.update(lengthPrefixed(utf8Bytes(TRANSCRIPT_DOMAIN_TAG)))
  hash.update(lengthPrefixed(encodeUint32Be(protocolVersion)))
  hash.update(lengthPrefixed(utf8Bytes(transferId)))
  hash.update(lengthPrefixed(utf8Bytes(SOURCE_ROLE_LABEL)))
  hash.update(lengthPrefixed(sourcePublicKey))
  hash.update(lengthPrefixed(utf8Bytes(DESTINATION_ROLE_LABEL)))
  hash.update(lengthPrefixed(destinationPublicKey))
  hash.update(lengthPrefixed(utf8Bytes(pairingCapability)))
  return hash.digest()
}

function bestEffortZero(...buffers: readonly Uint8Array[]): void {
  for (const buffer of buffers) buffer.fill(0)
}

/**
 * Derives all migration transfer keys from the completed key exchange and the
 * pairing transcript. Both roles derive the identical human code, the
 * identical transcript hash, and mirrored directional keys (source
 * streamTxKey === destination streamRxKey and vice versa).
 */
export async function deriveMigrationKeys({
  role,
  ownKeyPair,
  peerPublicKey,
  transferId,
  pairingCapability,
  protocolVersion,
}: DeriveMigrationKeysParams): Promise<MigrationKeys> {
  await sodium.ready

  if (ownKeyPair.publicKey.length !== KX_PUBLIC_KEY_BYTES) {
    throw new MigrationKeyExchangeError({
      message: `Own public key must be ${KX_PUBLIC_KEY_BYTES} bytes`,
    })
  }
  if (ownKeyPair.privateKey.length !== KX_PRIVATE_KEY_BYTES) {
    throw new MigrationKeyExchangeError({
      message: `Own private key must be ${KX_PRIVATE_KEY_BYTES} bytes`,
    })
  }
  if (peerPublicKey.length !== KX_PUBLIC_KEY_BYTES) {
    throw new MigrationKeyExchangeError({
      message: `Peer public key must be ${KX_PUBLIC_KEY_BYTES} bytes`,
    })
  }
  if (
    !Number.isSafeInteger(protocolVersion) ||
    protocolVersion < 0 ||
    protocolVersion > 0xffffffff
  ) {
    throw new MigrationKeyExchangeError({
      message: 'Protocol version must be a non-negative integer below 2^32',
    })
  }
  if (transferId.length === 0) {
    throw new MigrationKeyExchangeError({
      message: 'Transfer id must not be empty',
    })
  }
  if (pairingCapability.length === 0) {
    throw new MigrationKeyExchangeError({
      message: 'Pairing capability must not be empty',
    })
  }

  // Source = crypto_kx server, destination = crypto_kx client.
  let sessionKeys
  try {
    sessionKeys =
      role === 'source'
        ? sodium.crypto_kx_server_session_keys(
            ownKeyPair.publicKey,
            ownKeyPair.privateKey,
            peerPublicKey
          )
        : sodium.crypto_kx_client_session_keys(
            ownKeyPair.publicKey,
            ownKeyPair.privateKey,
            peerPublicKey
          )
  } catch (cause) {
    throw new MigrationKeyExchangeError({
      message: 'Key exchange failed (invalid or low-order peer public key)',
      cause,
    })
  }

  // Map the (rx, tx) pair onto protocol directions. See module comment.
  const sourceToDestSessionKey =
    role === 'source' ? sessionKeys.sharedTx : sessionKeys.sharedRx
  const destToSourceSessionKey =
    role === 'source' ? sessionKeys.sharedRx : sessionKeys.sharedTx

  const sourcePublicKey =
    role === 'source' ? ownKeyPair.publicKey : peerPublicKey
  const destinationPublicKey =
    role === 'source' ? peerPublicKey : ownKeyPair.publicKey

  const transcriptHash = computeTranscriptHash({
    protocolVersion,
    transferId,
    sourcePublicKey,
    destinationPublicKey,
    pairingCapability,
  })

  try {
    // HMAC-based extract: bind the transcript into every derived key.
    const masterSourceToDest = sodium.crypto_auth(
      transcriptHash,
      sourceToDestSessionKey
    )
    const masterDestToSource = sodium.crypto_auth(
      transcriptHash,
      destToSourceSessionKey
    )

    const sourceToDestStreamKey = sodium.crypto_kdf_derive_from_key(
      DERIVED_KEY_BYTES,
      KDF_SUBKEY_ID,
      STREAM_KEY_KDF_CONTEXT,
      masterSourceToDest
    )
    const destToSourceStreamKey = sodium.crypto_kdf_derive_from_key(
      DERIVED_KEY_BYTES,
      KDF_SUBKEY_ID,
      STREAM_KEY_KDF_CONTEXT,
      masterDestToSource
    )
    const sourceToDestQrAuthKey = sodium.crypto_kdf_derive_from_key(
      DERIVED_KEY_BYTES,
      KDF_SUBKEY_ID,
      QR_MAC_KEY_KDF_CONTEXT,
      masterSourceToDest
    )
    const destToSourceQrAuthKey = sodium.crypto_kdf_derive_from_key(
      DERIVED_KEY_BYTES,
      KDF_SUBKEY_ID,
      QR_MAC_KEY_KDF_CONTEXT,
      masterDestToSource
    )

    // Human code is derived from the canonical source→destination direction
    // so both devices display the identical value.
    const humanCodeBytes = sodium.crypto_kdf_derive_from_key(
      DERIVED_KEY_BYTES,
      KDF_SUBKEY_ID,
      HUMAN_CODE_KDF_CONTEXT,
      masterSourceToDest
    )
    const humanAuthCode = String(
      readUint32Be(humanCodeBytes) % 1_000_000
    ).padStart(6, '0')

    bestEffortZero(
      masterSourceToDest,
      masterDestToSource,
      humanCodeBytes,
      sessionKeys.sharedRx,
      sessionKeys.sharedTx
    )

    return {
      streamTxKey:
        role === 'source' ? sourceToDestStreamKey : destToSourceStreamKey,
      streamRxKey:
        role === 'source' ? destToSourceStreamKey : sourceToDestStreamKey,
      qrMacTxKey:
        role === 'source' ? sourceToDestQrAuthKey : destToSourceQrAuthKey,
      qrMacRxKey:
        role === 'source' ? destToSourceQrAuthKey : sourceToDestQrAuthKey,
      humanAuthCode,
      transcriptHash,
    }
  } catch (cause) {
    if (cause instanceof MigrationKeyExchangeError) throw cause
    throw new MigrationKeyExchangeError({
      message: 'Migration key derivation failed',
      cause,
    })
  }
}

// Exported for transcript-related tests; not part of the public pairing API.
export {computeTranscriptHash as computeMigrationTranscriptHash}
