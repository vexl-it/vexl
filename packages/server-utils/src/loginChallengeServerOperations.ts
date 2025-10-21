import {
  generatePrivateKey,
  importKeyPair,
} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  decodeLoginChallengeRequestPayload,
  encodeLoginChallengeRequestPayload,
  InvalidLoginSignatureError,
  LoginChallengeServerSignature,
  type LoginChallengeClientSignature,
  type LoginChallengeRequestEncoded,
} from '@vexl-next/domain/src/general/loginChallenge'
import {
  unixMillisecondsFromNow,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  EcdsaSignature,
  ecdsaVerifyE,
  generateChallenge,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema} from 'effect/index'
import {ServerCrypto} from './ServerCrypto'

// 30sec
const CHALLENGE_VALIDITY_MILLIS = 30 * 1000

export const generateAndSignLoginChallenge = (
  expirationInMs: number = CHALLENGE_VALIDITY_MILLIS
): Effect.Effect<
  {
    encodedChallenge: LoginChallengeRequestEncoded
    serverSignature: LoginChallengeServerSignature
  },
  UnexpectedServerError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const serverCrypto = yield* _(ServerCrypto)

    const keyPair = generatePrivateKey()
    const challenge = yield* _(generateChallenge())
    const validUntil = unixMillisecondsFromNow(CHALLENGE_VALIDITY_MILLIS)

    const encodedChallenge = yield* _(
      encodeLoginChallengeRequestPayload({
        privateKey: keyPair.privateKeyPemBase64,
        challenge,
        validUntil,
      })
    )

    const serverSignature = yield* _(
      serverCrypto.signEcdsa(encodedChallenge),
      Effect.flatMap(Schema.decode(LoginChallengeServerSignature))
    )
    return {
      encodedChallenge,
      serverSignature,
    }
  }).pipe(
    Effect.catchAll(
      (e) =>
        new UnexpectedServerError({
          cause: e,
          status: 500,
          message: 'Error while generating and signing login challenge',
        })
    )
  )

export const verifyLoginChallenge = ({
  encodedChallenge,
  serverSignature,
  clientSignature,
}: {
  encodedChallenge: LoginChallengeRequestEncoded
  serverSignature: LoginChallengeServerSignature
  clientSignature: LoginChallengeClientSignature
}): Effect.Effect<true, InvalidLoginSignatureError, ServerCrypto> =>
  Effect.gen(function* (_) {
    const serverCrypto = yield* _(ServerCrypto)

    const serverSignatureValid = yield* _(
      serverCrypto.verifyEcdsa({
        data: encodedChallenge,
        signature: Schema.decodeSync(EcdsaSignature)(serverSignature),
      })
    )

    if (!serverSignatureValid) {
      return yield* _(
        Effect.fail(new InvalidLoginSignatureError({status: 400}))
      )
    }

    const decodedChallengePayload = yield* _(
      decodeLoginChallengeRequestPayload(encodedChallenge)
    )
    if (unixMillisecondsNow() > decodedChallengePayload.validUntil) {
      return yield* _(
        Effect.fail(new InvalidLoginSignatureError({status: 400}))
      )
    }

    const {publicKeyPemBase64: publicKey} = importKeyPair(
      decodedChallengePayload.privateKey
    )
    const clientSignatureValid = yield* _(
      ecdsaVerifyE(publicKey)({
        data: decodedChallengePayload.challenge,
        signature: Schema.decodeSync(EcdsaSignature)(clientSignature),
      })
    )
    if (!clientSignatureValid) {
      return yield* _(
        Effect.fail(new InvalidLoginSignatureError({status: 400}))
      )
    }

    return true as const
  }).pipe(
    Effect.catchTags({
      'ParseError': () =>
        new InvalidLoginSignatureError({
          status: 400,
        }),
      'CryptoError': () =>
        new InvalidLoginSignatureError({
          status: 400,
        }),
    })
  )
