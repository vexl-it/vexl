import {type CryptoError} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Challenge} from '@vexl-next/rest-api/src/challenges/contracts'
import {Effect, Schema, type ParseResult} from 'effect/index'
import {ServerCrypto} from '../../../ServerCrypto'
import {ChallengePayload} from './challengePayload'

export const sealChallenge = (
  payload: ChallengePayload
): Effect.Effect<
  Challenge,
  CryptoError | ParseResult.ParseError,
  ServerCrypto
> =>
  Effect.gen(function* (_) {
    const serverCrypto = yield* _(ServerCrypto)
    return yield* _(
      serverCrypto.cryptoBoxSeal(ChallengePayload)(payload),
      Effect.flatMap(Schema.decode(Challenge))
    )
  })
