import {PublicKeyV2} from '@vexl-next/cryptography'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  UnixMilliseconds,
  unixMillisecondsFromNow,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  type CryptoBoxCypher,
  type CryptoBoxSignature,
  cryptoBoxVerifySignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  UpgradeAuthChallenge,
  UpgradeAuthInvalidSignatureError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {
  UserDataShape,
  type VexlAuthHeader,
} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, pipe, Schema} from 'effect'

const CHALLENGE_VALID_FOR_MILIS = 10 * 1000 * 60 // 10 minutes

const ChallengePayloadSchema = Schema.Struct({
  forPublicKey: PublicKeyV2,
  validUntil: UnixMilliseconds,
})

type ChallengePayload = typeof ChallengePayloadSchema.Type

export const generateChallengeForPublicKey = (
  publicKey: PublicKeyV2
): Effect.Effect<UpgradeAuthChallenge, UnexpectedServerError, ServerCrypto> =>
  Effect.gen(function* () {
    const crypto = yield* ServerCrypto

    const challengePayload: ChallengePayload = {
      forPublicKey: publicKey,
      validUntil: unixMillisecondsFromNow(CHALLENGE_VALID_FOR_MILIS),
    }

    return yield* pipe(
      crypto.cryptoBoxSeal(ChallengePayloadSchema)(challengePayload),
      Effect.flatMap(Schema.decodeEffect(UpgradeAuthChallenge))
    )
  }).pipe(
    Effect.catch(
      (e) =>
        new UnexpectedServerError({
          message: 'Failed to generate challenge for public key',
          cause: e,
        })
    )
  )

export const verifyChallengeResponse = (
  forPublicKey: PublicKeyV2,
  challenge: CryptoBoxCypher,
  signature: CryptoBoxSignature
): Effect.Effect<
  void,
  UnexpectedServerError | UpgradeAuthInvalidSignatureError,
  ServerCrypto
> =>
  Effect.gen(function* () {
    const crypto = yield* ServerCrypto

    const decodedChallenge = yield* pipe(
      crypto.cryptoBoxUnseal(ChallengePayloadSchema)(challenge),
      Effect.mapError(
        (e) =>
          new UpgradeAuthInvalidSignatureError({
            message: 'Invalid challenge',
            cause: e,
          })
      )
    )

    if (
      decodedChallenge.forPublicKey !== forPublicKey ||
      decodedChallenge.validUntil < unixMillisecondsNow()
    ) {
      return yield* new UpgradeAuthInvalidSignatureError({
        message: 'Invalid challenge',
        cause: null,
      })
    }

    const isValidSignature = yield* cryptoBoxVerifySignature(forPublicKey)(
      challenge,
      signature
    )
    if (!isValidSignature) {
      return yield* new UpgradeAuthInvalidSignatureError({
        message: 'Invalid signature',
        cause: null,
      })
    }
  }).pipe(
    Effect.catchTag(
      'CryptoError',
      (e) =>
        new UnexpectedServerError({
          message: 'Error verifying challenge response',
          cause: e,
        })
    )
  )

export const createVexlAuthHeader = ({
  hash,
  publicKeyV2,
}: {
  hash: HashedPhoneNumber
  publicKeyV2: PublicKeyV2
}): Effect.Effect<VexlAuthHeader, UnexpectedServerError, ServerCrypto> =>
  Effect.gen(function* () {
    const crypto = yield* ServerCrypto
    const data = {
      hash,
      pk: publicKeyV2,
    }

    const encodedData = yield* pipe(
      Schema.encodeEffect(UserDataShape)(data),
      Effect.mapError(
        (e) =>
          new UnexpectedServerError({
            message: 'Failed to encode VexlAuthHeader payload',
            cause: e,
          })
      )
    )

    const signature = yield* pipe(
      crypto.cryptoBoxSign(encodedData),
      Effect.catchTag(
        'CryptoError',
        (e) =>
          new UnexpectedServerError({
            message: 'Failed to sign VexlAuthHeader payload',
            cause: e,
          })
      )
    )

    return {data, signature}
  })
