import {
  AEAD_ChaCha20Poly1305,
  KDF_HKDF_SHA256,
  KEM_DHKEM_X25519_HKDF_SHA256,
} from '@panva/hpke-noble'
import {Array, Effect, Option, Schema} from 'effect'
import * as HPKE from 'hpke'
import {OhttpGatewaySecret, OhttpKeyConfig} from './ohttp.brand'

/**
 * Oblivious HTTP request encapsulation (RFC 9458 §4.3) with a single fixed
 * suite: DHKEM(X25519, HKDF-SHA256), HKDF-SHA256, ChaCha20Poly1305. All three
 * are pure JS (noble), so the same code runs in Hermes and Node.
 *
 * Deviation from RFC 9458: the encapsulated content is an application payload,
 * not a Binary HTTP message, so the HPKE info label differs. Relays never see
 * the content, so this does not affect relay compatibility.
 */

const KEM_ID = 0x0020
const KDF_ID = 0x0001
const AEAD_ID = 0x0003
const PUBLIC_KEY_LENGTH = 32
const PRIVATE_KEY_LENGTH = 32
const ENC_LENGTH = 32
const HEADER_LENGTH = 7
/** Bytes encapsulation adds to the plaintext: header, encapsulated key, AEAD tag. */
export const OHTTP_REQUEST_OVERHEAD_BYTES = HEADER_LENGTH + ENC_LENGTH + 16
const GATEWAY_SECRET_LENGTH = 1 + PRIVATE_KEY_LENGTH

const suite = new HPKE.CipherSuite(
  KEM_DHKEM_X25519_HKDF_SHA256,
  KDF_HKDF_SHA256,
  AEAD_ChaCha20Poly1305
)

export class OhttpInvalidKeyError extends Schema.TaggedError<OhttpInvalidKeyError>(
  'OhttpInvalidKeyError'
)('OhttpInvalidKeyError', {
  message: Schema.String,
}) {}

export class OhttpUnknownKeyError extends Schema.TaggedError<OhttpUnknownKeyError>(
  'OhttpUnknownKeyError'
)('OhttpUnknownKeyError', {
  keyId: Schema.Number,
}) {}

export class OhttpDecapsulationError extends Schema.TaggedError<OhttpDecapsulationError>(
  'OhttpDecapsulationError'
)('OhttpDecapsulationError', {
  message: Schema.String,
}) {}

const u16 = (value: number): number[] => [(value >> 8) & 0xff, value & 0xff]

const requestHeader = (keyId: number): Uint8Array =>
  Uint8Array.from([keyId, ...u16(KEM_ID), ...u16(KDF_ID), ...u16(AEAD_ID)])

const requestInfo = (header: Uint8Array): Uint8Array =>
  HPKE.concat(
    HPKE.encode('message/vexl-analytics request'),
    Uint8Array.of(0),
    header
  )

const fromBase64 = (value: string): Uint8Array =>
  new Uint8Array(Buffer.from(value, 'base64'))

const toBase64 = (value: Uint8Array): string =>
  Buffer.from(value).toString('base64')

const bytesEqual = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length &&
  Array.every(Array.fromIterable(a), (byte, i) => byte === b[i])

const keyConfigBytes = (keyId: number, publicKey: Uint8Array): Uint8Array =>
  Uint8Array.from([
    keyId,
    ...u16(KEM_ID),
    ...publicKey,
    ...u16(4),
    ...u16(KDF_ID),
    ...u16(AEAD_ID),
  ])

const parseKeyConfig = (
  keyConfig: OhttpKeyConfig
): Effect.Effect<
  {keyId: number; publicKey: Uint8Array},
  OhttpInvalidKeyError
> => {
  const bytes = fromBase64(keyConfig)
  const keyId = bytes[0] ?? 0
  const publicKey = bytes.subarray(3, 3 + PUBLIC_KEY_LENGTH)
  return bytesEqual(bytes, keyConfigBytes(keyId, publicKey))
    ? Effect.succeed({keyId, publicKey})
    : Effect.fail(
        new OhttpInvalidKeyError({message: 'Unsupported OHTTP key config'})
      )
}

const parseGatewaySecret = (
  secret: OhttpGatewaySecret
): Effect.Effect<
  {keyId: number; privateKey: Uint8Array},
  OhttpInvalidKeyError
> => {
  const bytes = fromBase64(secret)
  const keyId = bytes[0]
  if (keyId === undefined || bytes.length !== GATEWAY_SECRET_LENGTH)
    return Effect.fail(
      new OhttpInvalidKeyError({message: 'Malformed OHTTP gateway secret'})
    )
  return Effect.succeed({keyId, privateKey: bytes.subarray(1)})
}

const invalidKey = (message: string) => () =>
  new OhttpInvalidKeyError({message})

export const generateGatewayKey = (
  keyId: number
): Effect.Effect<
  {keyConfig: OhttpKeyConfig; gatewaySecret: OhttpGatewaySecret},
  OhttpInvalidKeyError
> =>
  Effect.tryPromise({
    try: async () => {
      if (!Number.isInteger(keyId) || keyId < 0 || keyId > 255)
        throw new Error('Key id must be a byte')
      const keyPair = await suite.GenerateKeyPair(true)
      const publicKey = await suite.SerializePublicKey(keyPair.publicKey)
      const privateKey = await suite.SerializePrivateKey(keyPair.privateKey)
      return {
        keyConfig: OhttpKeyConfig.make(
          toBase64(keyConfigBytes(keyId, publicKey))
        ),
        gatewaySecret: OhttpGatewaySecret.make(
          toBase64(Uint8Array.from([keyId, ...privateKey]))
        ),
      }
    },
    catch: invalidKey('Could not generate OHTTP gateway key'),
  })

export const encapsulateRequest = ({
  keyConfig,
  plaintext,
}: {
  keyConfig: OhttpKeyConfig
  plaintext: Uint8Array
}): Effect.Effect<Uint8Array<ArrayBuffer>, OhttpInvalidKeyError> =>
  Effect.flatMap(parseKeyConfig(keyConfig), ({keyId, publicKey}) =>
    Effect.tryPromise({
      try: async () => {
        const header = requestHeader(keyId)
        const {encapsulatedSecret, ciphertext} = await suite.Seal(
          await suite.DeserializePublicKey(publicKey),
          plaintext,
          {info: requestInfo(header)}
        )
        // Copy onto a plain ArrayBuffer so it is a valid fetch body
        return new Uint8Array(
          HPKE.concat(header, encapsulatedSecret, ciphertext)
        )
      },
      catch: invalidKey('Could not encapsulate OHTTP request'),
    })
  )

export const decapsulateRequest = ({
  gatewaySecrets,
  request,
}: {
  gatewaySecrets: readonly OhttpGatewaySecret[]
  request: Uint8Array
}): Effect.Effect<
  Uint8Array,
  OhttpUnknownKeyError | OhttpDecapsulationError | OhttpInvalidKeyError
> =>
  Effect.gen(function* (_) {
    const keyId = request[0]
    if (keyId === undefined || request.length < HEADER_LENGTH + ENC_LENGTH)
      return yield* _(
        new OhttpDecapsulationError({message: 'Request too short'})
      )

    const header = request.subarray(0, HEADER_LENGTH)
    if (!bytesEqual(header, requestHeader(keyId)))
      return yield* _(
        new OhttpDecapsulationError({message: 'Unsupported OHTTP suite'})
      )

    const keys = yield* _(Effect.forEach(gatewaySecrets, parseGatewaySecret))
    const key = yield* _(
      Array.findFirst(keys, (one) => one.keyId === keyId),
      Option.match({
        onNone: () => Effect.fail(new OhttpUnknownKeyError({keyId})),
        onSome: Effect.succeed,
      })
    )

    return yield* _(
      Effect.tryPromise({
        try: async () =>
          await suite.Open(
            await suite.DeserializePrivateKey(key.privateKey),
            request.subarray(HEADER_LENGTH, HEADER_LENGTH + ENC_LENGTH),
            request.subarray(HEADER_LENGTH + ENC_LENGTH),
            {info: requestInfo(header)}
          ),
        catch: () =>
          new OhttpDecapsulationError({
            message: 'Could not open OHTTP request',
          }),
      })
    )
  })
