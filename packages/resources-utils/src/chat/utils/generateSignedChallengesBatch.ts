import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {toError, type BasicError} from '@vexl-next/domain/src/utility/errors'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type SignedChallenge} from '@vexl-next/rest-api/src/services/chat/contracts'
import {type Effect} from 'effect'
import * as O from 'fp-ts/Option'
import * as RA from 'fp-ts/ReadonlyArray'
import * as TE from 'fp-ts/TaskEither'
import {flow, pipe} from 'fp-ts/function'
import {effectToTaskEither} from '../../effect-helpers/TaskEitherConverter'
import {ecdsaSign} from '../../utils/crypto'

function selectKeyPair(
  keyPairs: PrivateKeyHolder[]
): (publicKey: PublicKeyPemBase64) => O.Option<PrivateKeyHolder> {
  return (publicKey: PublicKeyPemBase64) => {
    return pipe(
      keyPairs.find((k) => k.publicKeyPemBase64 === publicKey),
      O.fromNullable
    )
  }
}

export type ErrorGeneratingSignedChallengeBatch =
  BasicError<'ErrorGeneratingSignedChallengeBatch'>
export type ApiErrorsGeneratingChallengeBatch = Effect.Effect.Error<
  ReturnType<ChatApi['createChallengeBatch']>
>

export function generateSignedChallengeBatch(
  chatApi: ChatApi
): (
  keyPairs: PrivateKeyHolder[]
) => TE.TaskEither<
  ErrorGeneratingSignedChallengeBatch | ApiErrorsGeneratingChallengeBatch,
  Array<{publicKey: PublicKeyPemBase64; challenge: SignedChallenge}>
> {
  return (keyPairs) => {
    if (keyPairs.length === 0) return TE.right([])
    return pipe(
      effectToTaskEither(
        chatApi.createChallengeBatch({
          publicKeys: keyPairs.map((k) => k.publicKeyPemBase64),
        })
      ),
      TE.map((one) => one.challenges),
      TE.chainW(
        flow(
          RA.map((challenge) =>
            pipe(
              selectKeyPair(keyPairs)(challenge.publicKey),
              TE.fromOption(
                () =>
                  new Error(
                    'Server did not return challenge for each public key sent'
                  )
              ),
              TE.map((keyPair) => ({keyPair, challenge})),
              TE.chainW(({keyPair, challenge}) =>
                TE.fromEither(ecdsaSign(keyPair)(challenge.challenge))
              ),
              TE.map((signature) => ({
                publicKey: challenge.publicKey,
                challenge: {
                  signature,
                  challenge: challenge.challenge,
                },
              }))
            )
          ),
          RA.sequence(TE.ApplicativePar),
          TE.mapLeft(toError('ErrorGeneratingSignedChallengeBatch'))
        )
      ),
      // Readonly workaround
      TE.map((one) => [...one])
    )
  }
}
