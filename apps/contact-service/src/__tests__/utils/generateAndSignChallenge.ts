import {type HttpClient} from '@effect/platform/index'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type CryptoError,
  ecdsaSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type SignedChallenge} from '@vexl-next/rest-api/src/challenges/contracts'
import {type TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from './NodeTestingApp'

class ErrorGeneratingChallenge extends Schema.TaggedError<ErrorGeneratingChallenge>(
  'ErrorGeneratingChallenge'
)('ErrorGeneratingChallenge', {
  cause: Schema.Unknown,
}) {}

export const generateAndSignChallenge = (
  key: PrivateKeyHolder
): Effect.Effect<
  {
    signedChallenge: SignedChallenge
    publicKey: PublicKeyPemBase64
  },
  CryptoError | ErrorGeneratingChallenge,
  HttpClient.HttpClient | TestRequestHeaders
> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const challenge = yield* _(
      app.Challenges.createChallenge({
        payload: {publicKey: key.publicKeyPemBase64},
      }),
      Effect.mapError((cause) => new ErrorGeneratingChallenge({cause}))
    )
    const signature = yield* _(
      ecdsaSignE(key.privateKeyPemBase64)(challenge.challenge)
    )
    return {
      publicKey: key.publicKeyPemBase64,
      signedChallenge: {challenge: challenge.challenge, signature},
    }
  })
