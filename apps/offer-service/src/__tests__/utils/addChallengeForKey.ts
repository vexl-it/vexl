import {
  type KeyPairV2,
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  cryptoBoxSign,
  ecdsaSignE,
  type EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type SignedChallenge} from '@vexl-next/rest-api/src/challenges/contracts'
import {
  setAuthHeaders,
  TestRequestHeaders,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Option, pipe, Schema} from 'effect'
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
    },
    keyPairV2?: KeyPairV2
  ) =>
  <T>(
    request: T,
    simulateInvalidChallenge?: boolean
  ): Effect.Effect<
    T & {
      readonly publicKey: PublicKeyPemBase64
      readonly publicKeyV2: Option.Option<KeyPairV2['publicKey']>
      readonly senderPublicKey: PublicKeyPemBase64 // Make this compatible with all requests is ignored when ot used
      readonly signedChallenge: SignedChallenge
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
          publicKeyV2: keyPairV2
            ? Option.some(keyPairV2.publicKey)
            : Option.none(),
        },
      })

      const signedChallenge = yield* ecdsaSignE(key.privateKeyPemBase64)(
        simulateInvalidChallenge ? 'bad' : challenge.challenge
      )
      const signedChallengeV2 = keyPairV2
        ? yield* pipe(
            cryptoBoxSign(keyPairV2.privateKey)(
              simulateInvalidChallenge ? 'bad' : challenge.challenge
            ),
            Effect.map(Option.some)
          )
        : Option.none()

      yield* TestRequestHeaders.setHeaders(initHeaders)

      return {
        ...request,
        publicKey: key.publicKeyPemBase64,
        publicKeyV2: keyPairV2
          ? Option.some(keyPairV2.publicKey)
          : Option.none(),
        senderPublicKey: key.publicKeyPemBase64,
        signedChallenge: {
          challenge: challenge.challenge,
          signature: signedChallenge,
          signatureV2: signedChallengeV2,
        },
      }
    }).pipe(Effect.mapError((e) => new AddingChallengeError({cause: e})))
