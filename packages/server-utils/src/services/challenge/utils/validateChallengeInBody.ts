import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  cryptoBoxVerifySignature,
  ecdsaVerifyE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  InvalidChallengeError,
  type RequestBaseWithChallenge,
} from '@vexl-next/rest-api/src/challenges/contracts'
import {Effect, Equal, Option, pipe} from 'effect'
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
  Effect.gen(function* () {
    const serverCrypto = yield* ServerCrypto

    const unsealedSignature = yield* pipe(
      serverCrypto.cryptoBoxUnseal(ChallengePayload)(challenge),
      Effect.mapError((e) => new InvalidChallengeError({}))
    )

    if (unsealedSignature.expiresAt < unixMillisecondsNow()) {
      yield* Effect.log('Challenge expired')
      return yield* new InvalidChallengeError({})
    }

    if (
      !Equal.equals(publicKeyV2, unsealedSignature.publicKeyV2) ||
      publicKey !== unsealedSignature.publicKey
    ) {
      yield* Effect.log('Challenge public keys mismatch', {
        publicKey,
        publicKeyV2,
        unsealedPublicKey: unsealedSignature.publicKey,
        unsealedPublicKeyV2: unsealedSignature.publicKeyV2,
      })
      return yield* new InvalidChallengeError({})
    }

    const v1isValid = yield* pipe(
      ecdsaVerifyE(publicKey)({data: challenge, signature}),
      Effect.mapError((e) => new InvalidChallengeError({}))
    )
    if (!v1isValid) {
      yield* Effect.log('Invalid V1 challenge signature')
      return yield* new InvalidChallengeError({})
    }

    if (Option.isSome(publicKeyV2)) {
      if (Option.isNone(signatureV2)) {
        yield* Effect.log('Missing V2 signature')
        return yield* new InvalidChallengeError({})
      }
      const v2isValid = yield* pipe(
        cryptoBoxVerifySignature(publicKeyV2.value)(
          challenge,
          signatureV2.value
        ),
        Effect.mapError((e) => new InvalidChallengeError({}))
      )
      if (!v2isValid) {
        yield* Effect.log('Invalid V2 challenge signature')
        return yield* new InvalidChallengeError({})
      }
    }
  })
