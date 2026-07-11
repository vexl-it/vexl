import {Schema} from 'effect'
import sodium from 'libsodium-wrappers'
import {concatBytes, lengthPrefixed, utf8Bytes} from './encoding'
import {type MigrationRole} from './keyExchange'

/**
 * Directional MACs for the device-migration QR control records (erase
 * command, cancellation confirmation, source-erased receipt).
 *
 * MAC input construction (documented for security review):
 *
 *   crypto_auth(
 *     lengthPrefixed('vexl-migration-qr-v1')
 *       || roleByte                       (0x01 = source, 0x02 = destination)
 *       || lengthPrefixed(payloadBytes),
 *     key
 *   )
 *
 * where lengthPrefixed(x) = 4-byte big-endian byteLength(x) || x. crypto_auth
 * is HMAC-SHA512-256 (32-byte MAC, 32-byte key). The sender role byte is the
 * role of the device that CREATED the MAC. Combined with the directional
 * QR-MAC keys from deriveMigrationKeys (qrMacTxKey/qrMacRxKey), a record
 * created by one role can never be replayed as if it came from the other.
 *
 * Verification uses sodium.crypto_auth_verify, which compares in constant
 * time internally.
 */

const QR_MAC_DOMAIN_TAG = 'vexl-migration-qr-v1'
const SOURCE_ROLE_BYTE = 0x01
const DESTINATION_ROLE_BYTE = 0x02

export const QR_MAC_BYTES = 32
export const QR_MAC_KEY_BYTES = 32

/**
 * Error thrown when a QR MAC is created or verified with invalid parameters
 * (wrong key size). Verification of attacker-controlled data never throws —
 * it returns false.
 */
export class QrMacError extends Schema.TaggedError<QrMacError>('QrMacError')(
  'QrMacError',
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  }
) {}

function buildMacInput(
  payloadBytes: Uint8Array,
  senderRole: MigrationRole
): Uint8Array {
  return concatBytes(
    lengthPrefixed(utf8Bytes(QR_MAC_DOMAIN_TAG)),
    Uint8Array.of(
      senderRole === 'source' ? SOURCE_ROLE_BYTE : DESTINATION_ROLE_BYTE
    ),
    lengthPrefixed(payloadBytes)
  )
}

function validateKey(key: Uint8Array): void {
  if (key.length !== QR_MAC_KEY_BYTES) {
    throw new QrMacError({
      message: `QR MAC key must be ${QR_MAC_KEY_BYTES} bytes`,
    })
  }
}

/**
 * Creates a 32-byte directional MAC over the caller-provided payload bytes.
 *
 * @param payloadBytes - canonical encoded QR record bytes
 * @param key - the creating device's qrMacTxKey from deriveMigrationKeys
 * @param senderRole - the role of the device creating the MAC
 */
export async function createQrMac(
  payloadBytes: Uint8Array,
  key: Uint8Array,
  senderRole: MigrationRole
): Promise<Uint8Array> {
  await sodium.ready
  validateKey(key)

  try {
    return sodium.crypto_auth(buildMacInput(payloadBytes, senderRole), key)
  } catch (cause) {
    throw new QrMacError({message: 'Failed to create QR MAC', cause})
  }
}

/**
 * Verifies a directional QR MAC in constant time.
 *
 * @param mac - the 32-byte MAC to verify (attacker-controlled; a wrong length
 *   returns false instead of throwing)
 * @param payloadBytes - canonical encoded QR record bytes
 * @param key - the verifying device's qrMacRxKey from deriveMigrationKeys
 * @param senderRole - the role of the device that claims to have created the
 *   record (i.e. the PEER of the verifying device)
 */
export async function verifyQrMac(
  mac: Uint8Array,
  payloadBytes: Uint8Array,
  key: Uint8Array,
  senderRole: MigrationRole
): Promise<boolean> {
  await sodium.ready
  validateKey(key)

  if (mac.length !== QR_MAC_BYTES) return false

  try {
    return sodium.crypto_auth_verify(
      mac,
      buildMacInput(payloadBytes, senderRole),
      key
    )
  } catch {
    return false
  }
}
