import {Schema} from 'effect'
import {Base64} from 'js-base64'

/**
 * 32 CSPRNG bytes encoded as url-safe base64 without padding (43 chars).
 * Matches the output of libsodium `to_base64` with URLSAFE_NO_PADDING and
 * js-base64 `fromUint8Array(bytes, true)`.
 */
const BASE64URL_OF_32_RANDOM_BYTES = /^[A-Za-z0-9_-]{43}$/

/** Lowercase hex encoding of a SHA-256 digest. */
const SHA256_HEX = /^[0-9a-f]{64}$/

const isBase64OfByteLength =
  (expectedByteLength: number) =>
  (value: string): boolean =>
    Base64.isValid(value) &&
    Base64.toUint8Array(value).length === expectedByteLength

/** Random identifier of one migration transfer. Never sent to Vexl. */
export const TransferId = Schema.String.pipe(
  Schema.filter((value) => BASE64URL_OF_32_RANDOM_BYTES.test(value)),
  Schema.brand('TransferId')
)
export type TransferId = typeof TransferId.Type

/**
 * One-time pairing capability carried inside the initial pairing QR. The
 * destination proves knowledge of it during the handshake.
 */
export const PairingCapability = Schema.String.pipe(
  Schema.filter((value) => BASE64URL_OF_32_RANDOM_BYTES.test(value)),
  Schema.brand('PairingCapability')
)
export type PairingCapability = typeof PairingCapability.Type

/** Random single-use nonce of one erase command. */
export const CommandNonce = Schema.String.pipe(
  Schema.filter((value) => BASE64URL_OF_32_RANDOM_BYTES.test(value)),
  Schema.brand('CommandNonce')
)
export type CommandNonce = typeof CommandNonce.Type

/**
 * Random single-use nonce of one source-erased receipt or source
 * cancellation confirmation.
 */
export const ReceiptNonce = Schema.String.pipe(
  Schema.filter((value) => BASE64URL_OF_32_RANDOM_BYTES.test(value)),
  Schema.brand('ReceiptNonce')
)
export type ReceiptNonce = typeof ReceiptNonce.Type

/** Generic SHA-256 digest of one snapshot record (MMKV entry, session, file). */
export const Sha256Hex = Schema.String.pipe(
  Schema.filter((value) => SHA256_HEX.test(value)),
  Schema.brand('Sha256Hex')
)
export type Sha256Hex = typeof Sha256Hex.Type

/**
 * Domain-separated SHA-256 commitment to every canonical logical value and
 * file in a snapshot (spec section "Snapshot content digest"). Sensitive
 * migration metadata — never log or report it.
 */
export const SnapshotContentDigest = Schema.String.pipe(
  Schema.filter((value) => SHA256_HEX.test(value)),
  Schema.brand('SnapshotContentDigest')
)
export type SnapshotContentDigest = typeof SnapshotContentDigest.Type

/**
 * SHA-256 of the canonical snapshot manifest with both digest fields
 * omitted. Sensitive migration metadata — never log or report it.
 */
export const ManifestDigest = Schema.String.pipe(
  Schema.filter((value) => SHA256_HEX.test(value)),
  Schema.brand('ManifestDigest')
)
export type ManifestDigest = typeof ManifestDigest.Type

/** SHA-256 of the destination's durable staging receipt. */
export const StagingReceiptDigest = Schema.String.pipe(
  Schema.filter((value) => SHA256_HEX.test(value)),
  Schema.brand('StagingReceiptDigest')
)
export type StagingReceiptDigest = typeof StagingReceiptDigest.Type

/** SHA-256 of one accepted erase command record. */
export const EraseCommandDigest = Schema.String.pipe(
  Schema.filter((value) => SHA256_HEX.test(value)),
  Schema.brand('EraseCommandDigest')
)
export type EraseCommandDigest = typeof EraseCommandDigest.Type

/** Coarse digest of the successful source cleanup result. */
export const CleanupResultDigest = Schema.String.pipe(
  Schema.filter((value) => SHA256_HEX.test(value)),
  Schema.brand('CleanupResultDigest')
)
export type CleanupResultDigest = typeof CleanupResultDigest.Type

/** Ephemeral X25519 key-exchange public key (32 bytes, base64 encoded). */
export const MigrationKeyExchangePublicKey = Schema.String.pipe(
  Schema.filter(isBase64OfByteLength(32)),
  Schema.brand('MigrationKeyExchangePublicKey')
)
export type MigrationKeyExchangePublicKey =
  typeof MigrationKeyExchangePublicKey.Type

/**
 * MAC over an authenticated QR record made with one directional
 * QR-authentication key (libsodium `crypto_auth`, 32 bytes, base64 encoded).
 */
export const QrAuthMac = Schema.String.pipe(
  Schema.filter(isBase64OfByteLength(32)),
  Schema.brand('QrAuthMac')
)
export type QrAuthMac = typeof QrAuthMac.Type

/**
 * Short human authentication code derived from the pairing transcript and
 * displayed on both devices. A confirmation aid, not a cryptographic key.
 */
export const HumanAuthCode = Schema.String.pipe(
  Schema.filter((value) => /^[0-9]{6}$/.test(value)),
  Schema.brand('HumanAuthCode')
)
export type HumanAuthCode = typeof HumanAuthCode.Type
