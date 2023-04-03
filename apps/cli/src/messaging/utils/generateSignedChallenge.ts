import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {flow, pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import * as A from 'fp-ts/Array'
import * as O from 'fp-ts/Option'
import {ecdsaSign} from '../../utils/crypto'
import {safeParse} from '../../utils/parsing'
import {SignedChallenge} from '@vexl-next/rest-api/dist/services/chat/contracts'

export interface ChallengeError {
  readonly _tag: 'ChallengeError'
  e: unknown
}

export default function generateSignedChallenge({
  keypair,
  chatApi,
}: {
  keypair: PrivateKeyHolder
  chatApi: ChatPrivateApi
}): TE.TaskEither<ChallengeError, SignedChallenge> {
  return pipe(
    chatApi.createChallenge({publicKey: keypair.publicKeyPemBase64}),
    TE.map((one) => one.challenge),
    TE.bindTo('challenge'),
    TE.bindW('signature', ({challenge}) =>
      TE.fromEither(ecdsaSign(keypair)(challenge))
    ),
    TE.chainEitherKW(safeParse(SignedChallenge)),
    TE.mapLeft((e) => ({_tag: 'ChallengeError', e} as const))
  )
}

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

export function generateSignedChallengeBatch(
  chatApi: ChatPrivateApi
): (
  keyPairs: PrivateKeyHolder[]
) => TE.TaskEither<
  ChallengeError,
  Array<{publicKey: PublicKeyPemBase64; challenge: SignedChallenge}>
> {
  return (keyPairs) =>
    pipe(
      chatApi.createChallengeBatch({
        publicKeys: keyPairs.map((k) => k.publicKeyPemBase64),
      }),
      TE.map((one) => one.challenges),
      TE.chainW(
        flow(
          A.map((challenge) =>
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
          A.sequence(TE.ApplicativePar)
        )
      ),
      TE.mapLeft((e) => ({_tag: 'ChallengeError', e} as const))
    )
}
