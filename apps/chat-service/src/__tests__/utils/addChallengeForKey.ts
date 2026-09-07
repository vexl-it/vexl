import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  ecdsaSignE,
  type EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type RequestBaseWithChallenge} from '@vexl-next/rest-api/src/challenges/contracts'
import {
  setAuthHeaders,
  TestRequestHeaders,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, Schema} from 'effect'
import {type HttpClient} from 'effect/unstable/http'
import {NodeTestingApp} from './NodeTestingApp'

export class AddingChallengeError extends Schema.TaggedError<AddingChallengeError>(
  'AddingChallengeError'
)('AddingChallengeError', {
  cause: Schema.Unknown,
}) {}

export const addChallengeForKey =
  (
    key: PrivateKeyHolder,
    authHeaders: {
      'public-key': PublicKeyPemBase64
      signature: EcdsaSignature
      hash: HashedPhoneNumber
    }
  ) =>
  <T>(
    request: T,
    simulateInvalidChallenge?: boolean
  ): Effect.Effect<
    T &
      RequestBaseWithChallenge & {
        readonly senderPublicKey: PublicKeyPemBase64 // Make this compatible with all requests is ignored when ot used
      },
    AddingChallengeError,
    HttpClient.HttpClient | TestRequestHeaders
  > =>
    Effect.gen(function* () {
      const client = yield* NodeTestingApp
      const initHeaders = yield* TestRequestHeaders.getHeaders

      yield* setAuthHeaders(authHeaders)
      const challenge = yield* client.Challenges.createChallenge({
        payload: {
          publicKey: key.publicKeyPemBase64,
          publicKeyV2: Option.none(),
        },
      })

      const signedChallenge = yield* ecdsaSignE(key.privateKeyPemBase64)(
        simulateInvalidChallenge ? 'bad' : challenge.challenge
      )

      yield* TestRequestHeaders.setHeaders(initHeaders)
      return {
        ...request,
        publicKey: key.publicKeyPemBase64,
        publicKeyV2: Option.none(),
        senderPublicKey: key.publicKeyPemBase64,
        signedChallenge: {
          challenge: challenge.challenge,
          signature: signedChallenge,
          signatureV2: Option.none(),
        },
      }
    }).pipe(Effect.mapError((e) => new AddingChallengeError({cause: e})))
