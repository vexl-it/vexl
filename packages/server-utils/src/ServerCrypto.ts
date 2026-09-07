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
import {Config, Context, Effect, flow, Layer, Schema} from 'effect'

export interface ServerCryptoOperations {
  encryptECIES: <A, I, R>(
    schema: Schema.Codec<A, I, R, R>
  ) => (
    data: A
  ) => Effect.Effect<EciesGTMECypher, CryptoError | Schema.SchemaError, R>

  decryptECIES: <A, I, R>(
    schema: Schema.Codec<A, I, R, R>
  ) => (
    data: EciesGTMECypher
  ) => Effect.Effect<A, CryptoError | Schema.SchemaError, R>

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
    schema: Schema.Codec<A, I, R, R>
  ) => (
    data: A
  ) => Effect.Effect<AesGtmCypher, CryptoError | Schema.SchemaError, R>

  decryptAES: <A, I, R>(
    schema: Schema.Codec<A, I, R, R>
  ) => (
    data: AesGtmCypher
  ) => Effect.Effect<A, CryptoError | Schema.SchemaError, R>

  cryptoBoxSign: (
    challenge: string
  ) => Effect.Effect<CryptoBoxSignature, CryptoError>
  cryptoBoxVerifySignature: (
    data: string,
    signature: CryptoBoxSignature
  ) => Effect.Effect<boolean, CryptoError>

  cryptoBoxSeal: <A, I, R>(
    schema: Schema.Codec<A, I, R, R>
  ) => (
    data: A
  ) => Effect.Effect<CryptoBoxCypher, CryptoError | Schema.SchemaError, R>

  cryptoBoxUnseal: <A, I, R>(
    schema: Schema.Codec<A, I, R, R>
  ) => (
    data: CryptoBoxCypher
  ) => Effect.Effect<A, CryptoError | Schema.SchemaError, R>
}

export type CryptoConfig = Config.Wrap<{
  publicKey: PublicKeyPemBase64
  privateKey: PrivateKeyPemBase64
  hmacKey: string
  easKey: string
  libsodiumPrivateKey: PrivateKeyV2
}>

export class ServerCrypto extends Context.Service<
  ServerCrypto,
  ServerCryptoOperations
>()('ServerCrypto') {
  static readonly layer = (
    cryptoConfig: CryptoConfig
  ): Layer.Layer<ServerCrypto, Config.ConfigError | CryptoError, never> =>
    Layer.effect(
      ServerCrypto,
      Effect.gen(function* () {
        const cryptoConfigUnwraped = yield* Config.unwrap(cryptoConfig)

        const libsodiumPublicKey = yield* derivePubKey(
          cryptoConfigUnwraped.libsodiumPrivateKey
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
            const encodeJson = Schema.encodeEffect(
              Schema.fromJsonString(schema)
            )
            return flow(encodeJson, Effect.flatMap(encryptEciesWithServerKey))
          },
          decryptECIES: (schema) => {
            const decodeJson = Schema.decodeEffect(
              Schema.fromJsonString(schema)
            )
            return flow(decryptEciesWithServerKey, Effect.flatMap(decodeJson))
          },
          signWithHmac: hmacSignE(cryptoConfigUnwraped.hmacKey),
          verifyHmac: hmacVerifyE(cryptoConfigUnwraped.hmacKey),

          signEcdsa: ecdsaSignWithServerKey,
          verifyEcdsa: ecdsaVerifyWithServerKey,

          encryptAES: (schema) => {
            const encodeJson = Schema.encodeEffect(
              Schema.fromJsonString(schema)
            )
            return flow(encodeJson, Effect.flatMap(encryptAesWithServerKey))
          },
          decryptAES: (schema) => {
            const decodeJson = Schema.decodeEffect(
              Schema.fromJsonString(schema)
            )
            return flow(decryptAesWithServiceKey, Effect.flatMap(decodeJson))
          },
          cryptoBoxSign: cryptoBoxSign(
            cryptoConfigUnwraped.libsodiumPrivateKey
          ),
          cryptoBoxVerifySignature:
            cryptoBoxVerifySignature(libsodiumPublicKey),
          cryptoBoxSeal: (schema) => {
            const encodeJson = Schema.encodeEffect(
              Schema.fromJsonString(schema)
            )
            return flow(
              encodeJson,
              Effect.flatMap(cryptoBoxSeal(libsodiumPublicKey))
            )
          },
          cryptoBoxUnseal: (schema) => {
            const decodeJson = Schema.decodeEffect(
              Schema.fromJsonString(schema)
            )
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
