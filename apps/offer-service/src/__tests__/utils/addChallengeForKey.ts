import {HttpClientRequest} from '@effect/platform'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  ecdsaSignE,
  type CryptoError,
  type EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type SignedChallenge} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {Effect} from 'effect'
import {type ClientError} from 'effect-http'
import {NodeTestingApp} from './NodeTestingApp'

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
    CryptoError | ClientError.ClientError,
    NodeTestingApp
  > =>
    Effect.gen(function* (_) {
      const client = yield* _(NodeTestingApp)

      const challenge = yield* _(
        client.createChallenge(
          {
            body: {publicKey: key.publicKeyPemBase64},
          },
          HttpClientRequest.setHeaders(authHeaders)
        )
      )

      const signedChallenge = yield* _(
        ecdsaSignE(key.privateKeyPemBase64)(
          simulateInvalidChallenge ? 'bad' : challenge.challenge
        )
      )

      return {
        ...request,
        publicKey: key.publicKeyPemBase64,
        senderPublicKey: key.publicKeyPemBase64,
        signedChallenge: {
          challenge: challenge.challenge,
          signature: signedChallenge,
        },
      }
    })
