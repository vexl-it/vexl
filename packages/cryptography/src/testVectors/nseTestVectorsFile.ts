import {Schema} from 'effect/index'
import {Curve} from '../KeyHolder/Curve.brand'
import {PrivateKeyPemBase64, PublicKeyPemBase64} from '../KeyHolder/brands'

/**
 * Schema of the checked-in NSE (iOS Notification Service Extension) crypto
 * test-vectors file at packages/cryptography/test-vectors/nse-test-vectors.json
 *
 * The file pins the exact wire formats produced by this package so that the
 * Swift implementation used by the NSE can be validated against the reference
 * TypeScript implementation.
 */

export const NSE_TEST_VECTORS_RELATIVE_PATH =
  'test-vectors/nse-test-vectors.json'

export const TestVectorKey = Schema.Struct({
  id: Schema.String,
  curve: Curve,
  /** Fields exactly as stored in PrivateKeyHolder */
  privateKeyPemBase64: PrivateKeyPemBase64,
  publicKeyPemBase64: PublicKeyPemBase64,
  /** 32 byte big-endian scalar, hex encoded (for cross-checking) */
  privateKeyRawHex: Schema.String,
  /** Uncompressed SEC1 point 0x04 || X || Y (65 bytes), hex encoded */
  publicKeyRawUncompressedHex: Schema.String,
})
export type TestVectorKey = typeof TestVectorKey.Type

export const EciesDecryptVector = Schema.Struct({
  id: Schema.String,
  keyId: Schema.String,
  recipientPrivateKey: PrivateKeyPemBase64,
  recipientPublicKey: PublicKeyPemBase64,
  ciphertext: Schema.String,
  expectedPlaintext: Schema.String,
  /**
   * true - decryption must succeed and yield expectedPlaintext
   * false - decryption must fail (graceful error, never a crash)
   */
  valid: Schema.Boolean,
  note: Schema.optional(Schema.String),
})
export type EciesDecryptVector = typeof EciesDecryptVector.Type

export const EcdsaVerifyVector = Schema.Struct({
  id: Schema.String,
  keyId: Schema.String,
  privateKey: PrivateKeyPemBase64,
  publicKey: PublicKeyPemBase64,
  message: Schema.String,
  signature: Schema.String,
  /** true - signature must verify; false - verification must return false */
  valid: Schema.Boolean,
  note: Schema.optional(Schema.String),
})
export type EcdsaVerifyVector = typeof EcdsaVerifyVector.Type

export const NseTestVectorsFile = Schema.Struct({
  metadata: Schema.Struct({
    description: Schema.String,
    generator: Schema.String,
    curve: Schema.String,
    keyFormats: Schema.Struct({
      privateKeyPemBase64: Schema.String,
      publicKeyPemBase64: Schema.String,
      privateKeyRawHex: Schema.String,
      publicKeyRawUncompressedHex: Schema.String,
    }),
    eciesGTM: Schema.Struct({
      usedFor: Schema.String,
      payloadFormat: Schema.String,
      versionPrefix: Schema.String,
      sharedSecret: Schema.String,
      cipherKeyAndIv: Schema.String,
      cipher: Schema.String,
      hmac: Schema.String,
      ephemeralPublicKey: Schema.String,
      base64: Schema.String,
      emptyPlaintext: Schema.String,
    }),
    eciesLegacy: Schema.Struct({
      usedFor: Schema.String,
      payloadFormat: Schema.String,
      sharedSecret: Schema.String,
      cipherKeyAndIv: Schema.String,
      cipher: Schema.String,
      hmac: Schema.String,
      ephemeralPublicKey: Schema.String,
      base64: Schema.String,
      trailingZeroBytes: Schema.String,
    }),
    ecdsa: Schema.Struct({
      hash: Schema.String,
      signatureEncoding: Schema.String,
      keys: Schema.String,
    }),
  }),
  keys: Schema.Array(TestVectorKey),
  eciesGTMDecrypt: Schema.Array(EciesDecryptVector),
  eciesLegacyDecrypt: Schema.Array(EciesDecryptVector),
  ecdsaVerify: Schema.Array(EcdsaVerifyVector),
})
export type NseTestVectorsFile = typeof NseTestVectorsFile.Type
