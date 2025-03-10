import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type CryptoError,
  ecdsaSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type SignedChallenge} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {Effect} from 'effect'
import {type ClientError} from 'effect-http'
import {NodeTestingApp} from './NodeTestingApp'

export const generateAndSignChallenge = (
  key: PrivateKeyHolder
): Effect.Effect<
  {
    signedChallenge: SignedChallenge
    publicKey: PublicKeyPemBase64
  },
  CryptoError | ClientError.ClientError,
  NodeTestingApp
> =>
  Effect.gen(function* (_) {
    const app = yield* _(NodeTestingApp)
    const challenge = yield* _(
      app.createChallenge({body: {publicKey: key.publicKeyPemBase64}})
    )
    const signature = yield* _(
      ecdsaSignE(key.privateKeyPemBase64)(challenge.challenge)
    )
    return {
      publicKey: key.publicKeyPemBase64,
      signedChallenge: {challenge: challenge.challenge, signature},
    }
  })
