import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  cryptoBoxVerifySignature,
  ecdsaVerifyE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidChallengeError,
  type RequestBaseWithChallenge,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {Effect, Equal, Option} from 'effect/index'
import {ServerCrypto} from '../../../ServerCrypto'
import {ChallengePayload} from './challengePayload'

export const validateChallengeInBody = ({
  publicKey,
  publicKeyV2,
  signedChallenge: {challenge, signature, signatureV2},
}: RequestBaseWithChallenge): Effect.Effect<
  void,
  InvalidChallengeError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const serverCrypto = yield* _(ServerCrypto)

    const unsealedSignature = yield* _(
      serverCrypto.cryptoBoxUnseal(ChallengePayload)(challenge),
      Effect.mapError((e) => new InvalidChallengeError({}))
    )

    if (unsealedSignature.expiresAt < unixMillisecondsNow()) {
      yield* _(Effect.log('Challenge expired'))
      return yield* _(new InvalidChallengeError({}))
    }

    if (
      !Equal.equals(publicKeyV2, unsealedSignature.publicKeyV2) ||
      publicKey !== unsealedSignature.publicKey
    ) {
      yield* _(
        Effect.log('Challenge public keys mismatch', {
          publicKey,
          publicKeyV2,
          unsealedPublicKey: unsealedSignature.publicKey,
          unsealedPublicKeyV2: unsealedSignature.publicKeyV2,
        })
      )
      return yield* _(new InvalidChallengeError({}))
    }

    const v1isValid = yield* _(
      ecdsaVerifyE(publicKey)({data: challenge, signature}),
      Effect.mapError((e) => new InvalidChallengeError({}))
    )
    if (!v1isValid) {
      yield* _(Effect.log('Invalid V1 challenge signature'))
      return yield* _(new InvalidChallengeError({}))
    }

    if (Option.isSome(publicKeyV2)) {
      if (Option.isNone(signatureV2)) {
        yield* _(Effect.log('Missing V2 signature'))
        return yield* _(new InvalidChallengeError({}))
      }
      const v2isValid = yield* _(
        cryptoBoxVerifySignature(publicKeyV2.value)(
          challenge,
          signatureV2.value
        ),
        Effect.mapError((e) => new InvalidChallengeError({}))
      )
      if (!v2isValid) {
        yield* _(Effect.log('Invalid V2 challenge signature'))
        return yield* _(new InvalidChallengeError({}))
      }
    }
  })
