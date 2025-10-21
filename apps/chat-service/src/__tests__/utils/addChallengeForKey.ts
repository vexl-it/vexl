import {type HttpClient} from '@effect/platform'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  ecdsaSignE,
  type EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type SignedChallenge} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {
  setAuthHeaders,
  TestRequestHeaders,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
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
    T & {
      readonly publicKey: PublicKeyPemBase64
      readonly senderPublicKey: PublicKeyPemBase64 // Make this compatible with all requests is ignored when ot used
      readonly signedChallenge: SignedChallenge
    },
    AddingChallengeError,
    HttpClient.HttpClient | TestRequestHeaders
  > =>
    Effect.gen(function* (_) {
      const client = yield* _(NodeTestingApp)
      const initHeaders = yield* _(TestRequestHeaders.getHeaders)

      yield* _(setAuthHeaders(authHeaders))
      const challenge = yield* _(
        client.Challenges.createChallenge({
          payload: {publicKey: key.publicKeyPemBase64},
        })
      )

      const signedChallenge = yield* _(
        ecdsaSignE(key.privateKeyPemBase64)(
          simulateInvalidChallenge ? 'bad' : challenge.challenge
        )
      )

      yield* _(TestRequestHeaders.setHeaders(initHeaders))
      return {
        ...request,
        publicKey: key.publicKeyPemBase64,
        senderPublicKey: key.publicKeyPemBase64,
        signedChallenge: {
          challenge: challenge.challenge,
          signature: signedChallenge,
        },
      }
    }).pipe(Effect.mapError((e) => new AddingChallengeError({cause: e})))
