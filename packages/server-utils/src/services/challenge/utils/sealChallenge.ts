import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Challenge} from '@vexl-next/rest-api/src/challenges/contracts'
import {Effect, pipe, Schema} from 'effect'
import {ServerCrypto} from '../../../ServerCrypto'
import {ChallengePayload} from './challengePayload'

export const sealChallenge = (
  payload: ChallengePayload
): Effect.Effect<Challenge, CryptoError | Schema.SchemaError, ServerCrypto> =>
  Effect.gen(function* () {
    const serverCrypto = yield* ServerCrypto
    return yield* pipe(
      serverCrypto.cryptoBoxSeal(ChallengePayload)(payload),
      Effect.flatMap(Schema.decodeEffect(Challenge))
    )
  })
