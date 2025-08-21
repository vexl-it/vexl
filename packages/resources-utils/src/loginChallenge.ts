import {
  decodeLoginChallengeRequestPayload,
  LoginChallengeClientSignature,
  type LoginChallengeRequestEncoded,
} from '@vexl-next/domain/src/general/loginChallenge'
import {
  type CryptoError,
  ecdsaSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema} from 'effect/index'
import {type ParseError} from 'effect/ParseResult'

export const signLoginChallenge = (
  encodedChallenge: LoginChallengeRequestEncoded
): Effect.Effect<LoginChallengeClientSignature, ParseError | CryptoError> =>
  Effect.gen(function* (_) {
    const decodedChallenge = yield* _(
      decodeLoginChallengeRequestPayload(encodedChallenge)
    )
    const signature = yield* _(
      ecdsaSignE(decodedChallenge.privateKey)(decodedChallenge.challenge)
    )

    return yield* _(Schema.decode(LoginChallengeClientSignature)(signature))
  })
