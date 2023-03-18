import * as crypto from '@vexl-next/cryptography'
import {KeyFormat, type PrivateKey} from '@vexl-next/cryptography'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {type ChatPrivateApi} from '@vexl-next/rest-api/dist/services/chat'
import {safeParse, type ZodParseError} from '../../utils/fpUtils'
import {SignedChallenge} from '@vexl-next/rest-api/dist/services/chat/contracts'
import * as E from 'fp-ts/Either'

export interface GeneratingChallengeErorr {
  _tag: 'generatingSignedChallengeError'
  error: unknown
}

export function signChallenge(
  privateKey: PrivateKey
): (
  challenge: string
) => E.Either<Error | ZodParseError<SignedChallenge>, SignedChallenge> {
  return (challenge) =>
    pipe(
      E.tryCatch(
        () =>
          crypto.ecdsa.ecdsaSign({
            privateKey,
            challenge,
          }),
        (error) => new Error('Error signing challenge', error)
      ),
      E.map((signature) => ({signature, challenge})),
      E.chainW(safeParse(SignedChallenge))
    )
}

export function generateSignedChallenge(
  privateKey: PrivateKey,
  chatApi: ChatPrivateApi
): TE.TaskEither<GeneratingChallengeErorr, SignedChallenge> {
  return pipe(
    {publicKey: privateKey.exportPrivateKey(KeyFormat.PEM_BASE64)},
    chatApi.createChallenge,
    TE.map((response) => response.challenge),
    TE.chainEitherKW(signChallenge(privateKey)),
    TE.mapLeft((error) => ({_tag: 'generatingSignedChallengeError', error}))
  )
}
