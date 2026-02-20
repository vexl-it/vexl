import {
  type PrivateKeyPemBase64,
  type PrivateKeyV2,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  aesDecrpytE,
  aesEncrpytE,
  cryptoBoxSeal,
  cryptoBoxSign,
  cryptoBoxUnseal,
  cryptoBoxVerifySignature,
  derivePubKey,
  ecdsaSignE,
  ecdsaVerifyE,
  eciesGTMDecryptE,
  eciesGTMEncryptE,
  hmacSignE,
  hmacVerifyE,
  type AesGtmCypher,
  type CryptoBoxCypher,
  type CryptoBoxSignature,
  type CryptoError,
  type EcdsaSignature,
  type EciesGTMECypher,
  type HmacHash,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  Config,
  Context,
  Effect,
  flow,
  Layer,
  Schema,
  type ConfigError,
  type ParseResult,
} from 'effect'

export interface ServerCryptoOperations {
  encryptECIES: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    data: A
  ) => Effect.Effect<EciesGTMECypher, CryptoError | ParseResult.ParseError, R>

  decryptECIES: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    data: EciesGTMECypher
  ) => Effect.Effect<A, CryptoError | ParseResult.ParseError, R>

  signWithHmac: (payload: string) => Effect.Effect<HmacHash, CryptoError>
  verifyHmac: (args: {
    data: string
    signature: HmacHash
  }) => Effect.Effect<boolean, CryptoError>

  signEcdsa: (challenge: string) => Effect.Effect<EcdsaSignature, CryptoError>
  verifyEcdsa: (args: {
    data: string
    signature: EcdsaSignature
  }) => Effect.Effect<boolean, CryptoError>

  encryptAES: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    data: A
  ) => Effect.Effect<AesGtmCypher, CryptoError | ParseResult.ParseError, R>

  decryptAES: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    data: AesGtmCypher
  ) => Effect.Effect<A, CryptoError | ParseResult.ParseError, R>

  cryptoBoxSign: (
    challenge: string
  ) => Effect.Effect<CryptoBoxSignature, CryptoError>
  cryptoBoxVerifySignature: (
    data: string,
    signature: CryptoBoxSignature
  ) => Effect.Effect<boolean, CryptoError>

  cryptoBoxSeal: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    data: A
  ) => Effect.Effect<CryptoBoxCypher, CryptoError | ParseResult.ParseError, R>

  cryptoBoxUnseal: <A, I, R>(
    schema: Schema.Schema<A, I, R>
  ) => (
    data: CryptoBoxCypher
  ) => Effect.Effect<A, CryptoError | ParseResult.ParseError, R>
}

export type CryptoConfig = Config.Config.Wrap<{
  publicKey: PublicKeyPemBase64
  privateKey: PrivateKeyPemBase64
  hmacKey: string
  easKey: string
  libsodiumPrivateKey: PrivateKeyV2
}>

export class ServerCrypto extends Context.Tag('ServerCrypto')<
  ServerCrypto,
  ServerCryptoOperations
>() {
  static readonly layer = (
    cryptoConfig: CryptoConfig
  ): Layer.Layer<ServerCrypto, ConfigError.ConfigError | CryptoError, never> =>
    Layer.effect(
      ServerCrypto,
      Effect.gen(function* (_) {
        const cryptoConfigUnwraped = yield* _(Config.unwrap(cryptoConfig))

        const libsodiumPublicKey = yield* _(
          derivePubKey(cryptoConfigUnwraped.libsodiumPrivateKey)
        )

        const encryptEciesWithServerKey = eciesGTMEncryptE(
          cryptoConfigUnwraped.publicKey
        )
        const decryptEciesWithServerKey = eciesGTMDecryptE(
          cryptoConfigUnwraped.privateKey
        )

        const encryptAesWithServerKey = aesEncrpytE(cryptoConfigUnwraped.easKey)
        const decryptAesWithServiceKey = aesDecrpytE(
          cryptoConfigUnwraped.easKey
        )

        const ecdsaSignWithServerKey = ecdsaSignE(
          cryptoConfigUnwraped.privateKey
        )
        const ecdsaVerifyWithServerKey = ecdsaVerifyE(
          cryptoConfigUnwraped.publicKey
        )

        return {
          encryptECIES: (schema) => {
            const encodeJson = Schema.encode(Schema.parseJson(schema))
            return flow(encodeJson, Effect.flatMap(encryptEciesWithServerKey))
          },
          decryptECIES: (schema) => {
            const decodeJson = Schema.decode(Schema.parseJson(schema))
            return flow(decryptEciesWithServerKey, Effect.flatMap(decodeJson))
          },
          signWithHmac: hmacSignE(cryptoConfigUnwraped.hmacKey),
          verifyHmac: hmacVerifyE(cryptoConfigUnwraped.hmacKey),

          signEcdsa: ecdsaSignWithServerKey,
          verifyEcdsa: ecdsaVerifyWithServerKey,

          encryptAES: (schema) => {
            const encodeJson = Schema.encode(Schema.parseJson(schema))
            return flow(encodeJson, Effect.flatMap(encryptAesWithServerKey))
          },
          decryptAES: (schema) => {
            const decodeJson = Schema.decode(Schema.parseJson(schema))
            return flow(decryptAesWithServiceKey, Effect.flatMap(decodeJson))
          },
          cryptoBoxSign: cryptoBoxSign(
            cryptoConfigUnwraped.libsodiumPrivateKey
          ),
          cryptoBoxVerifySignature:
            cryptoBoxVerifySignature(libsodiumPublicKey),
          cryptoBoxSeal: (schema) => {
            const encodeJson = Schema.encode(Schema.parseJson(schema))
            return flow(
              encodeJson,
              Effect.flatMap(cryptoBoxSeal(libsodiumPublicKey))
            )
          },
          cryptoBoxUnseal: (schema) => {
            const decodeJson = Schema.decode(Schema.parseJson(schema))
            return flow(
              cryptoBoxUnseal({
                privateKey: cryptoConfigUnwraped.libsodiumPrivateKey,
                publicKey: libsodiumPublicKey,
              }),
              Effect.flatMap(decodeJson)
            )
          },
        }
      })
    )
}
