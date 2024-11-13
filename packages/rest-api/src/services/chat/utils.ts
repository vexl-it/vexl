import {
  type PrivateKeyHolderE,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ecdsaSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect} from 'effect'
import {type Client} from 'effect-http'
import {handleCommonErrorsEffect} from '../../utils'
import {type ErrorSigningChallenge, type SignedChallenge} from './contracts'
import {type ChatApiSpecification} from './specification'

export type ErrorGeneratingChallenge = Effect.Effect.Error<
  ReturnType<ReturnType<typeof generateChallenge>>
>

function generateChallenge({
  client,
}: {
  client: Client.Client<typeof ChatApiSpecification>
}) {
  return (publicKey: PublicKeyPemBase64) =>
    handleCommonErrorsEffect(
      client
        .createChallenge({body: {publicKey}})
        .pipe(Effect.map((one) => one.challenge))
    )
}

export function addChallengeToRequest(
  client: Client.Client<typeof ChatApiSpecification>
): <T extends {keyPair: PrivateKeyHolderE}>(
  data: T
) => Effect.Effect<
  Omit<T, 'keyPair'> & {
    publicKey: PublicKeyPemBase64
    signedChallenge: SignedChallenge
  },
  ErrorGeneratingChallenge | ErrorSigningChallenge | CryptoError
> {
  return ({keyPair, ...data}) =>
    Effect.gen(function* (_) {
      const publicKey = keyPair.publicKeyPemBase64
      const challenge = yield* _(generateChallenge({client})(publicKey))
      const signature = yield* _(
        ecdsaSignE(keyPair.privateKeyPemBase64)(challenge)
      )

      return {
        ...data,
        publicKey,
        signedChallenge: {challenge, signature},
      }
    })
}
