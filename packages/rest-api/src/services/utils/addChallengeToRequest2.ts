import {type HttpApiDecodeError} from '@effect/platform/HttpApiError'
import {type HttpClientError} from '@effect/platform/index'
import {
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type NotFoundError,
  type RateLimitedError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  ecdsaSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Schema} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {
  type ErrorSigningChallenge,
  type SignedChallenge,
} from '../../challenges/contracts'
import {
  type CreateChallengeRequest,
  type CreateChallengeResponse,
} from '../chat/contracts'

export type RequestWithGeneratableChallenge<T> = Omit<
  T,
  'publicKey' | 'signedChallenge'
> & {
  keyPair: PrivateKeyHolder
}

export class ErrorGeneratingChallenge extends Schema.TaggedError<ErrorGeneratingChallenge>(
  'ErrorGeneratingChallenge'
)('ErrorGeneratingChallenge', {
  cause: Schema.Unknown,
}) {}

type CreateChallengeCall = (request: {
  readonly payload: CreateChallengeRequest
}) => Effect.Effect<
  CreateChallengeResponse,
  | HttpApiDecodeError
  | ParseError
  | RateLimitedError
  | NotFoundError
  | UnexpectedServerError
  | HttpClientError.HttpClientError,
  never
>

function generateChallenge2(createChallengeCall: CreateChallengeCall) {
  return (publicKey: PublicKeyPemBase64) =>
    createChallengeCall({payload: {publicKey}}).pipe(
      Effect.map((one) => one.challenge),
      Effect.mapError((e) => new ErrorGeneratingChallenge({cause: e}))
    )
}

export function addChallengeToRequest2(
  createChallengeCall: CreateChallengeCall
): <T extends {keyPair: PrivateKeyHolder}>(
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
      const challenge = yield* _(
        generateChallenge2(createChallengeCall)(publicKey)
      )
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
