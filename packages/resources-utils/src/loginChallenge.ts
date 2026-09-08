import {
  decodeLoginChallengeRequestPayload,
  LoginChallengeClientSignature,
  type LoginChallengeRequestEncoded,
} from '@vexl-next/domain/src/general/loginChallenge'
import {
  type CryptoError,
  ecdsaSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'

export const signLoginChallenge = (
  encodedChallenge: LoginChallengeRequestEncoded
): Effect.Effect<LoginChallengeClientSignature, SchemaError | CryptoError> =>
  Effect.gen(function* () {
    const decodedChallenge =
      yield* decodeLoginChallengeRequestPayload(encodedChallenge)
    const signature = yield* ecdsaSignE(decodedChallenge.privateKey)(
      decodedChallenge.challenge
    )

    return yield* Schema.decodeEffect(LoginChallengeClientSignature)(signature)
  })
