import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type CryptoError,
  ecdsaSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type SignedChallenge} from '@vexl-next/rest-api/src/challenges/contracts'
import {type TestRequestHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, pipe, Schema} from 'effect'
import {type HttpClient} from 'effect/unstable/http'
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
    publicKeyV2: Option.Option<PublicKeyV2>
  },
  CryptoError | ErrorGeneratingChallenge,
  HttpClient.HttpClient | TestRequestHeaders
> =>
  Effect.gen(function* () {
    const app = yield* NodeTestingApp
    const challenge = yield* pipe(
      app.Challenges.createChallenge({
        payload: {
          publicKey: key.publicKeyPemBase64,
          publicKeyV2: Option.none(),
        },
      }),
      Effect.mapError((cause) => new ErrorGeneratingChallenge({cause}))
    )
    const signature = yield* ecdsaSignE(key.privateKeyPemBase64)(
      challenge.challenge
    )
    return {
      publicKey: key.publicKeyPemBase64,
      publicKeyV2: Option.none(),
      signedChallenge: {
        challenge: challenge.challenge,
        signature,
        signatureV2: Option.none(),
      },
    }
  })
