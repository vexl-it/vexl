import {
  type PrivateKeyHolder,
  type PrivateKeyHolderE,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  ecdsaSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {
  type ErrorSigningChallenge,
  type SignedChallenge,
} from '@vexl-next/server-utils/src/services/challenge/contracts'
import {type ChallengeApiSpecification} from '@vexl-next/server-utils/src/services/challenge/specification'
import {Effect} from 'effect'
import {type Client} from 'effect-http'
import {handleCommonErrorsEffect} from '../../utils'

export type RequestWithGeneratableChallenge<T> = Omit<
  T,
  'publicKey' | 'signedChallenge'
> & {
  keyPair: PrivateKeyHolder
}

export type ErrorGeneratingChallenge = Effect.Effect.Error<
  ReturnType<ReturnType<typeof generateChallenge>>
>

function generateChallenge({
  client,
}: {
  client: Client.Client<typeof ChallengeApiSpecification>
}) {
  return (publicKey: PublicKeyPemBase64) =>
    handleCommonErrorsEffect(
      client
        .createChallenge({body: {publicKey}})
        .pipe(Effect.map((one) => one.challenge))
    )
}

export function addChallengeToRequest(
  client: Client.Client<typeof ChallengeApiSpecification>
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
