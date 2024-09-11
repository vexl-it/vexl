import {Schema} from '@effect/schema'
import * as crypto from '@vexl-next/cryptography'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type ExtractLeftTE} from '@vexl-next/resources-utils/src/utils/ExtractLeft'
import {type AxiosInstance} from 'axios'
import * as E from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import {axiosCallWithValidation} from '../../utils'
import {
  ChatChallenge,
  CreateChallengeResponse,
  type SignedChallenge,
} from './contracts'

export type ErrorGeneratingChallenge = ExtractLeftTE<
  ReturnType<ReturnType<typeof generateChallenge>>
>

export interface ErrorSigningChallenge {
  readonly _tag: 'ErrorSigningChallenge'
  readonly error: unknown
}

export function ecdsaSign(
  privateKey: PrivateKeyHolder
): (challenge: string) => E.Either<ErrorSigningChallenge, string> {
  return (challenge: string) =>
    E.tryCatch(
      () =>
        crypto.ecdsa.ecdsaSign({
          privateKey: privateKey.privateKeyPemBase64,
          challenge,
        }),
      (e) => ({_tag: 'ErrorSigningChallenge', error: e}) as const
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

export function addChallengeToRequest(axiosInstance: AxiosInstance): <
  T extends {keyPair: PrivateKeyHolder},
>(
  data: T
) => TE.TaskEither<
  ErrorGeneratingChallenge | ErrorSigningChallenge,
  Omit<T, 'keyPair'> & {
    publicKey: PublicKeyPemBase64
    signedChallenge: SignedChallenge
  }
> {
  return ({keyPair, ...data}) =>
    pipe(
      keyPair.publicKeyPemBase64,
      generateChallenge({axiosInstance}),
      TE.map((one) => ChatChallenge.parse(one)),
      TE.bindTo('challenge'),
      TE.bindW('signature', ({challenge}) =>
        pipe(
          TE.fromEither(ecdsaSign(keyPair)(challenge)),
          TE.map((one) => Schema.decodeSync(EcdsaSignature)(one))
        )
      ),
      TE.map((signedChallenge) => ({
        ...data,
        publicKey: keyPair.publicKeyPemBase64,
        signedChallenge,
      }))
    )
}
