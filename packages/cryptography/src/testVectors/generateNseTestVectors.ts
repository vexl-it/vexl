/**
 * Generates the NSE (iOS Notification Service Extension) crypto test vectors
 * checked in at packages/cryptography/test-vectors/nse-test-vectors.json
 *
 * Run with: pnpm generate:nse-vectors (from packages/cryptography)
 *
 * Keys are derived deterministically. Ciphertexts and signatures are
 * randomized (ephemeral ECDH keys, random ECDSA nonce) - that is fine, the
 * vectors pin the DECRYPT / VERIFY direction. Every vector is validated
 * against the reference TypeScript implementation before being written.
 */
import {Schema} from 'effect/index'
import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {importKeyPair, type PrivateKeyHolder} from '../KeyHolder'
import {defaultCurve} from '../KeyHolder/Curve.brand'
import {PrivateKeyPemBase64, type PublicKeyPemBase64} from '../KeyHolder/brands'
import {privatePemToRaw, privateRawToPem} from '../KeyHolder/keyUtils'
import {getCrypto} from '../getCrypto'
import {ecdsaSign, ecdsaVerify} from '../operations/ecdsa'
import {eciesGTMDecrypt, eciesGTMEncrypt} from '../operations/ecies'
import {eciesLegacyDecrypt, eciesLegacyEncrypt} from '../operations/eciesLegacy'
import {
  NseTestVectorsFile,
  type EcdsaVerifyVector,
  type EciesDecryptVector,
  type TestVectorKey,
} from './nseTestVectorsFile'

const OUTPUT_FILE_URL = new URL(
  '../../test-vectors/nse-test-vectors.json',
  import.meta.url
)

function deterministicScalar(label: string): Buffer {
  // sha256 output is < secp256k1 group order with overwhelming probability
  return getCrypto().createHash('sha256').update(label).digest()
}

function createDeterministicKey(id: string): {
  key: TestVectorKey
  holder: PrivateKeyHolder
} {
  const scalar = deterministicScalar(`vexl-nse-test-vectors-${id}`)
  const privateKeyPemBase64 = Schema.decodeSync(PrivateKeyPemBase64)(
    privateRawToPem(scalar, defaultCurve).toString('base64')
  )
  const holder = importKeyPair(privateKeyPemBase64)

  const roundTripped = privatePemToRaw(holder.privateKeyPemBase64)
  if (!roundTripped.privateKey.equals(scalar))
    throw new Error(`Key ${id}: PEM round-trip changed the private scalar`)
  if (roundTripped.curve !== defaultCurve)
    throw new Error(`Key ${id}: unexpected curve ${roundTripped.curve}`)

  return {
    key: {
      id,
      curve: defaultCurve,
      privateKeyPemBase64: holder.privateKeyPemBase64,
      publicKeyPemBase64: holder.publicKeyPemBase64,
      privateKeyRawHex: scalar.toString('hex'),
      publicKeyRawUncompressedHex: roundTripped.publicKey.toString('hex'),
    },
    holder,
  }
}

/**
 * ~1 in 256 real inbox keys have a scalar starting with 0x00. The PEM
 * encoder (ECConverter.toBuffer) strips leading zero bytes, so their DER
 * stores a SHORT (31-byte or less) OCTET STRING scalar which decoders must
 * left-pad back to 32 bytes. Deterministically search for such a scalar so
 * the vectors pin that decode path.
 */
function createLeadingZeroScalarKey(idPrefix: string): {
  key: TestVectorKey
  holder: PrivateKeyHolder
} {
  for (let counter = 0; ; counter++) {
    const id = `${idPrefix}-${counter}`
    if (deterministicScalar(`vexl-nse-test-vectors-${id}`)[0] !== 0x00) continue
    return createDeterministicKey(id)
  }
}

function flipByteInBase64(base64: string, byteIndex: number): string {
  const bytes = Buffer.from(base64, 'base64')
  const byte = bytes[byteIndex]
  if (byte === undefined) throw new Error('Byte index out of range')
  bytes[byteIndex] = byte ^ 0xff
  return bytes.toString('base64')
}

// Mirrors the (non-exported) part encoding of eciesLegacy: `${len}A${base64}`
function parseLegacyParts(data: string): string[] {
  const parts: string[] = []
  let offset = 0
  while (offset < data.length) {
    const separatorIndex = data.indexOf('A', offset)
    if (separatorIndex < 0) throw new Error('Invalid legacy ciphertext')
    const partLength = Number.parseInt(data.slice(offset, separatorIndex), 10)
    parts.push(data.slice(separatorIndex + 1, separatorIndex + 1 + partLength))
    offset = separatorIndex + 1 + partLength
  }
  return parts
}

function encodeLegacyParts(parts: string[]): string {
  return parts.map((part) => `${part.length}A${part}`).join('')
}

const plaintexts = {
  emptyString: '',
  shortAscii: 'Hello Vexl!',
  longUnicode: [
    'Dlouhá zpráva s diakritikou: Příliš žluťoučký kůň úpěl ďábelské ódy. ',
    'Emoji: 🚀🔐₿🤝🇨🇿👍🏻😅🧡 ',
    'CJK: こんにちは世界、你好世界、안녕하세요 세계。 ',
    'RTL: مرحبا بالعالم שלום עולם ',
  ]
    .join('')
    .repeat(8),
  chatMessageJson: JSON.stringify({
    uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    text: 'Ahoj! Are we still on for tomorrow at 18:30? 🤝₿',
    time: 1751808000000,
    messageType: 'MESSAGE',
    myVersion: '1.44.0',
    lastReceivedVersion: '1.43.1',
    myVexlToken: 'vexl_nt_3J5j2mYQF3v8mS1kWq0dQgZk9t2yBcE4',
  }),
  // Deliberately OLDER `time` than chatMessageJson - the NSE selection tests
  // use the two of them to pin picking the message closest to the push's
  // sentAt instead of the globally newest one.
  chatMessageJsonOlder: JSON.stringify({
    uuid: '9b2d5c1e-7f3a-4d08-9c66-1a2b3c4d5e6f',
    text: 'Older message - must only preview for its own push 🙂',
    time: 1751704000000,
    messageType: 'MESSAGE',
    myVersion: '1.44.0',
  }),
}

async function generateEciesVectors({
  variant,
  encrypt,
  decrypt,
  emptyStringDecryptable,
  tamper,
  recipient,
  wrongRecipient,
}: {
  variant: 'gtm' | 'legacy'
  encrypt: (args: {
    publicKey: PublicKeyPemBase64
    data: string
  }) => Promise<string>
  decrypt: (args: {
    privateKey: PrivateKeyPemBase64
    data: string
  }) => Promise<string>
  emptyStringDecryptable: boolean
  tamper: (ciphertext: string) => string
  recipient: {key: TestVectorKey; holder: PrivateKeyHolder}
  wrongRecipient: {key: TestVectorKey; holder: PrivateKeyHolder}
}): Promise<EciesDecryptVector[]> {
  const encryptFor = async (data: string): Promise<string> =>
    await encrypt({publicKey: recipient.key.publicKeyPemBase64, data})

  const vectors: EciesDecryptVector[] = []

  for (const [name, plaintext] of Object.entries(plaintexts)) {
    const isEmpty = name === 'emptyString'
    const valid = isEmpty ? emptyStringDecryptable : true
    vectors.push({
      id: `${variant}-${name}`,
      keyId: recipient.key.id,
      recipientPrivateKey: recipient.key.privateKeyPemBase64,
      recipientPublicKey: recipient.key.publicKeyPemBase64,
      ciphertext: await encryptFor(plaintext),
      expectedPlaintext: plaintext,
      valid,
      ...(isEmpty && !valid
        ? {
            note: 'Reference TS parser rejects the empty ciphertext segment ("Bad data"). Decryption must fail gracefully.',
          }
        : {}),
    })
  }

  const tamperedSource = await encryptFor(plaintexts.shortAscii)
  vectors.push({
    id: `${variant}-tampered-ciphertext`,
    keyId: recipient.key.id,
    recipientPrivateKey: recipient.key.privateKeyPemBase64,
    recipientPublicKey: recipient.key.publicKeyPemBase64,
    ciphertext: tamper(tamperedSource),
    expectedPlaintext: plaintexts.shortAscii,
    valid: false,
    note: 'Ciphertext bytes were tampered with after encryption. MAC check must fail.',
  })

  vectors.push({
    id: `${variant}-wrong-recipient-key`,
    keyId: wrongRecipient.key.id,
    recipientPrivateKey: wrongRecipient.key.privateKeyPemBase64,
    recipientPublicKey: wrongRecipient.key.publicKeyPemBase64,
    ciphertext: await encryptFor(plaintexts.shortAscii),
    expectedPlaintext: plaintexts.shortAscii,
    valid: false,
    note: 'Ciphertext was encrypted for a different recipient. MAC check must fail.',
  })

  // Validate every vector against the reference implementation
  for (const vector of vectors) {
    if (vector.valid) {
      const decrypted = await decrypt({
        privateKey: vector.recipientPrivateKey,
        data: vector.ciphertext,
      })
      if (decrypted !== vector.expectedPlaintext)
        throw new Error(`Vector ${vector.id}: decrypted plaintext mismatch`)
    } else {
      let failed = false
      try {
        await decrypt({
          privateKey: vector.recipientPrivateKey,
          data: vector.ciphertext,
        })
      } catch {
        failed = true
      }
      if (!failed)
        throw new Error(`Vector ${vector.id}: expected decryption to fail`)
    }
  }

  return vectors
}

function generateEcdsaVectors(
  keys: Array<{key: TestVectorKey; holder: PrivateKeyHolder}>
): EcdsaVerifyVector[] {
  const [key1, key2] = keys
  if (!key1 || !key2) throw new Error('Need at least two keys')

  const challenge = (label: string): string =>
    deterministicScalar(`vexl-nse-challenge-${label}`).toString('base64')

  const sign = (
    keyEntry: {key: TestVectorKey; holder: PrivateKeyHolder},
    message: string
  ): string =>
    ecdsaSign({
      challenge: message,
      privateKey: keyEntry.holder.privateKeyPemBase64,
    })

  const challenge1 = challenge('1')
  const challenge2 = challenge('2')
  const challenge3 = challenge('3')

  const validSignature1 = sign(key1, challenge1)

  const vectors: EcdsaVerifyVector[] = [
    {
      id: 'ecdsa-valid-1',
      keyId: key1.key.id,
      privateKey: key1.key.privateKeyPemBase64,
      publicKey: key1.key.publicKeyPemBase64,
      message: challenge1,
      signature: validSignature1,
      valid: true,
    },
    {
      id: 'ecdsa-valid-2',
      keyId: key2.key.id,
      privateKey: key2.key.privateKeyPemBase64,
      publicKey: key2.key.publicKeyPemBase64,
      message: challenge2,
      signature: sign(key2, challenge2),
      valid: true,
    },
    {
      id: 'ecdsa-valid-3',
      keyId: key1.key.id,
      privateKey: key1.key.privateKeyPemBase64,
      publicKey: key1.key.publicKeyPemBase64,
      message: challenge3,
      signature: sign(key1, challenge3),
      valid: true,
    },
    {
      id: 'ecdsa-tampered-message',
      keyId: key1.key.id,
      privateKey: key1.key.privateKeyPemBase64,
      publicKey: key1.key.publicKeyPemBase64,
      message: challenge('tampered-message-different-from-signed'),
      signature: validSignature1,
      valid: false,
      note: 'Signature was created over a different message.',
    },
    {
      id: 'ecdsa-tampered-signature',
      keyId: key1.key.id,
      privateKey: key1.key.privateKeyPemBase64,
      publicKey: key1.key.publicKeyPemBase64,
      message: challenge1,
      // flips a value byte inside the DER-encoded r component
      signature: flipByteInBase64(validSignature1, 6),
      valid: false,
      note: 'One byte of the DER signature (inside r) was flipped.',
    },
    {
      id: 'ecdsa-wrong-public-key',
      keyId: key2.key.id,
      privateKey: key2.key.privateKeyPemBase64,
      publicKey: key2.key.publicKeyPemBase64,
      message: challenge1,
      signature: validSignature1,
      valid: false,
      note: 'Signature was created with a different private key than the public key provided.',
    },
  ]

  for (const vector of vectors) {
    const verified = ecdsaVerify({
      challenge: vector.message,
      signature: vector.signature,
      pubKey: vector.publicKey,
    })
    if (verified !== vector.valid)
      throw new Error(
        `Vector ${vector.id}: expected valid=${String(vector.valid)}, got ${String(verified)}`
      )
  }

  return vectors
}

async function main(): Promise<void> {
  const key1 = createDeterministicKey('key1')
  const key2 = createDeterministicKey('key2')
  const key3 = createDeterministicKey('key3')
  const key4 = createLeadingZeroScalarKey('key4-leading-zero')
  if (deterministicScalar(`vexl-nse-test-vectors-${key4.key.id}`)[0] !== 0)
    throw new Error('key4 must have a leading-zero scalar')

  const eciesGTMDecryptVectors = await generateEciesVectors({
    variant: 'gtm',
    encrypt: eciesGTMEncrypt,
    decrypt: eciesGTMDecrypt,
    emptyStringDecryptable: false,
    tamper: (ciphertext) => {
      const [version, cipherText, mac, epk, securityTag] = ciphertext.split('.')
      if (!version || !cipherText || !mac || !epk || !securityTag)
        throw new Error('Unexpected GTM ciphertext format')
      return [
        version,
        flipByteInBase64(cipherText, 0),
        mac,
        epk,
        securityTag,
      ].join('.')
    },
    recipient: key1,
    wrongRecipient: key2,
  })

  const eciesLegacyDecryptVectors = await generateEciesVectors({
    variant: 'legacy',
    encrypt: eciesLegacyEncrypt,
    decrypt: eciesLegacyDecrypt,
    emptyStringDecryptable: true,
    tamper: (ciphertext) => {
      const [cipherPart, macPart, epkPart] = parseLegacyParts(ciphertext)
      if (!cipherPart || !macPart || !epkPart)
        throw new Error('Unexpected legacy ciphertext format')
      return encodeLegacyParts([
        flipByteInBase64(cipherPart, 0),
        macPart,
        epkPart,
      ])
    },
    recipient: key1,
    wrongRecipient: key3,
  })

  // Extra vectors pinning the stripped-leading-zero DER scalar decode path
  // (key4): one chat-cipher decrypt and one challenge signature.
  const leadingZeroNote =
    'The recipient/signer private scalar starts with 0x00, so its PEM DER ' +
    'stores a stripped 31-byte OCTET STRING scalar. Decoders must left-pad ' +
    'it back to 32 bytes before use.'

  const leadingZeroLegacyVector: EciesDecryptVector = {
    id: 'legacy-leading-zero-scalar-key',
    keyId: key4.key.id,
    recipientPrivateKey: key4.key.privateKeyPemBase64,
    recipientPublicKey: key4.key.publicKeyPemBase64,
    ciphertext: await eciesLegacyEncrypt({
      publicKey: key4.key.publicKeyPemBase64,
      data: plaintexts.chatMessageJson,
    }),
    expectedPlaintext: plaintexts.chatMessageJson,
    valid: true,
    note: leadingZeroNote,
  }
  if (
    (await eciesLegacyDecrypt({
      privateKey: leadingZeroLegacyVector.recipientPrivateKey,
      data: leadingZeroLegacyVector.ciphertext,
    })) !== leadingZeroLegacyVector.expectedPlaintext
  )
    throw new Error('leading-zero legacy vector: decrypted plaintext mismatch')
  eciesLegacyDecryptVectors.push(leadingZeroLegacyVector)

  const leadingZeroChallenge = deterministicScalar(
    'vexl-nse-challenge-leading-zero'
  ).toString('base64')
  const leadingZeroEcdsaVector: EcdsaVerifyVector = {
    id: 'ecdsa-valid-leading-zero-scalar-key',
    keyId: key4.key.id,
    privateKey: key4.key.privateKeyPemBase64,
    publicKey: key4.key.publicKeyPemBase64,
    message: leadingZeroChallenge,
    signature: ecdsaSign({
      challenge: leadingZeroChallenge,
      privateKey: key4.holder.privateKeyPemBase64,
    }),
    valid: true,
    note: leadingZeroNote,
  }
  if (
    !ecdsaVerify({
      challenge: leadingZeroEcdsaVector.message,
      signature: leadingZeroEcdsaVector.signature,
      pubKey: leadingZeroEcdsaVector.publicKey,
    })
  )
    throw new Error('leading-zero ecdsa vector: signature must verify')
  const ecdsaVerifyVectors = [
    ...generateEcdsaVectors([key1, key2, key3]),
    leadingZeroEcdsaVector,
  ]

  const file: NseTestVectorsFile = {
    metadata: {
      description:
        'Crypto test vectors for the iOS Notification Service Extension (NSE). ' +
        'They pin the wire formats of the reference TypeScript implementation in ' +
        'packages/cryptography so a Swift implementation can be validated against it. ' +
        'NOTE: chat messages on the wire are encrypted with eciesLegacy ' +
        '(see packages/resources-utils/src/chat/utils/chatCrypto.ts -> eciesLegacyEncrypt/Decrypt), ' +
        'while eciesGTM is used for notification token cyphers.',
      generator:
        'packages/cryptography/src/testVectors/generateNseTestVectors.ts (pnpm generate:nse-vectors)',
      curve:
        'secp256k1 (all vectors; the app also supports legacy secp224r1 keys which are out of scope for the NSE)',
      keyFormats: {
        privateKeyPemBase64:
          'base64 (standard, padded) of the full PEM text of a PKCS#8 "BEGIN PRIVATE KEY" EC private key (this is the PrivateKeyHolder.privateKeyPemBase64 field). NOTE: the DER OCTET STRING scalar has leading zero bytes STRIPPED (~1/256 real keys are shorter than 32 bytes) - decoders must left-pad to 32 bytes (pinned by the key4-leading-zero-* key)',
        publicKeyPemBase64:
          'base64 (standard, padded) of the full PEM text of an SPKI "BEGIN PUBLIC KEY" EC public key (this is the PrivateKeyHolder.publicKeyPemBase64 field)',
        privateKeyRawHex: '32-byte big-endian scalar, lowercase hex',
        publicKeyRawUncompressedHex:
          'uncompressed SEC1 point 0x04 || X(32) || Y(32), 65 bytes, lowercase hex',
      },
      eciesGTM: {
        usedFor:
          'notification token cyphers (NOT chat messages; chat messages use eciesLegacy)',
        payloadFormat:
          "'000' '.' base64(ciphertext) '.' base64(hmac) '.' base64(ephemeralPublicKey) '.' base64(gcmAuthTag) - a single ASCII string joined by dots",
        versionPrefix:
          "3-digit zero-padded decimal of (version - 1); current version is 1 so the prefix is literally '000'",
        sharedSecret:
          'ECDH over secp256k1 between the ephemeral private key and the recipient public key; the shared secret is the 32-byte big-endian X coordinate of the resulting point (Node crypto ECDH.computeSecret semantics)',
        cipherKeyAndIv:
          "PBKDF2-HMAC-SHA1(password = sharedSecret, salt = 'vexlvexl' (utf8), iterations = 2000, dkLen = 44); AES key = bytes [0, 32), GCM IV = bytes [32, 44) (12 bytes)",
        cipher: 'AES-256-GCM, 12-byte IV, 16-byte auth tag, no AAD',
        hmac: "HMAC-SHA256 keyed with PBKDF2-HMAC-SHA256(password = sharedSecret, salt = 'vexlvexl' (utf8), iterations = 2000, dkLen = 108) bytes [44, 108) (64 bytes); the HMAC input is the ASCII bytes of the base64 ciphertext string (NOT the raw ciphertext bytes); MAC must be checked before decrypting",
        ephemeralPublicKey:
          'uncompressed SEC1 point (0x04 || X || Y, 65 bytes), base64 encoded',
        base64: 'standard alphabet (+/) with = padding everywhere',
        emptyPlaintext:
          'NOT decryptable: an empty plaintext produces an empty ciphertext segment which the reference parser rejects with "Bad data" - implementations must fail gracefully on it',
      },
      eciesLegacy: {
        usedFor:
          'chat messages on the wire (packages/resources-utils/src/chat/utils/chatCrypto.ts). This is the scheme the NSE needs to decrypt chat message previews.',
        payloadFormat:
          "concatenation of three length-prefixed parts, each encoded as <base64Length>A<base64> where <base64Length> is the decimal character count of the base64 string and 'A' is a literal separator; part order: ciphertext, hmac, ephemeralPublicKey",
        sharedSecret:
          'ECDH over secp256k1 between the ephemeral private key and the recipient public key; the shared secret is the 32-byte big-endian X coordinate of the resulting point (Node crypto ECDH.computeSecret semantics)',
        cipherKeyAndIv:
          "PBKDF2-HMAC-SHA1(password = sharedSecret, salt = 'vexlvexl' (utf8), iterations = 2000, dkLen = 108); AES key = bytes [0, 32); CTR IV (16 bytes) = bytes [32, 44) || 0x00 0x00 0x00 0x02",
        cipher: 'AES-256-CTR with the 16-byte IV described above',
        hmac: "HMAC-SHA256 keyed with PBKDF2-HMAC-SHA256(password = sharedSecret, salt = 'vexlvexl' (utf8), iterations = 2000, dkLen = 108) bytes [44, 108) (64 bytes); the HMAC input is the ASCII bytes of the base64 ciphertext string; MAC must be checked before decrypting",
        ephemeralPublicKey:
          'uncompressed SEC1 point (0x04 || X || Y, 65 bytes), base64 encoded',
        base64: 'standard alphabet (+/) with = padding everywhere',
        trailingZeroBytes:
          'after decryption the reference implementation strips ALL trailing 0x00 bytes from the plaintext (removeEmptyBytesAtTheEnd) before utf8-decoding; Swift must do the same for byte-exact parity',
      },
      ecdsa: {
        hash: 'SHA-256 over the UTF-8 bytes of the challenge string',
        signatureEncoding:
          'ASN.1 DER SEQUENCE of two INTEGERs (r, s), base64 encoded (standard alphabet, padded). The signer trims the byte buffer to the length declared in the DER header before base64-encoding; verifiers must accept plain DER. Signatures are NOT low-s normalized (OpenSSL default).',
        keys: 'privateKey / publicKey fields use the same PEM-base64 encodings as the keys block',
      },
    },
    keys: [key1.key, key2.key, key3.key, key4.key],
    eciesGTMDecrypt: eciesGTMDecryptVectors,
    eciesLegacyDecrypt: eciesLegacyDecryptVectors,
    ecdsaVerify: ecdsaVerifyVectors,
  }

  // Final sanity check: the file must decode with its own schema
  const encoded = JSON.parse(JSON.stringify(file))
  Schema.decodeUnknownSync(NseTestVectorsFile)(encoded)

  mkdirSync(dirname(fileURLToPath(OUTPUT_FILE_URL)), {recursive: true})
  writeFileSync(OUTPUT_FILE_URL, `${JSON.stringify(file, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${fileURLToPath(OUTPUT_FILE_URL)}`)
  console.log(
    `keys: ${file.keys.length}, eciesGTMDecrypt: ${file.eciesGTMDecrypt.length}, eciesLegacyDecrypt: ${file.eciesLegacyDecrypt.length}, ecdsaVerify: ${file.ecdsaVerify.length}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
