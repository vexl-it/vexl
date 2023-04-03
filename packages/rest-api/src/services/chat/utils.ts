import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/dist/KeyHolder'
import * as E from 'fp-ts/Either'
import {toError} from 'fp-ts/Either'
import * as crypto from '@vexl-next/cryptography'
import {type AxiosInstance} from 'axios'
import {pipe} from 'fp-ts/function'
import {axiosCallWithValidation} from '../../utils'
import {CreateChallengeResponse, type SignedChallenge} from './contracts'
import * as TE from 'fp-ts/TaskEither'

export interface ErrorGeneratingChallenge {
  readonly _tag: 'ErrorGeneratingChallenge'
  readonly error: unknown
}

export function ecdsaSign(
  privateKey: PrivateKeyHolder
): (challenge: string) => E.Either<Error, string> {
  return (challenge: string) =>
    E.tryCatch(
      () =>
        crypto.ecdsa.ecdsaSign({
          privateKey,
          challenge,
        }),
      toError
    )
}

function generateChallenge({axiosInstance}: {axiosInstance: AxiosInstance}) {
  return (publicKey: PublicKeyPemBase64) =>
    pipe(
      axiosCallWithValidation(
        axiosInstance,
        {method: 'POST', url: '/challenges', data: {publicKey}},
        CreateChallengeResponse
      ),
      TE.map((one) => one.challenge)
    )
}

export function addChallengeToRequest<T extends {keyPair: PrivateKeyHolder}>(
  axiosInstance: AxiosInstance
): (data: T) => TE.TaskEither<
  ErrorGeneratingChallenge,
  Omit<T, 'keyPair'> & {
    publicKey: PublicKeyPemBase64
    signedChallenge: SignedChallenge
  }
> {
  return ({keyPair, ...data}) =>
    pipe(
      keyPair.publicKeyPemBase64,
      generateChallenge({axiosInstance}),
      TE.bindTo('challenge'),
      TE.bindW('signature', ({challenge}) =>
        TE.fromEither(ecdsaSign(keyPair)(challenge))
      ),
      TE.map((signedChallenge) => ({
        ...data,
        publicKey: keyPair.publicKeyPemBase64,
        signedChallenge,
      })),
      TE.mapLeft((e) => ({_tag: 'ErrorGeneratingChallenge', error: e} as const))
    )
}
