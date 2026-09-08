import {
  type KeyPairV2,
  type PrivateKeyHolder,
  type PublicKeyPemBase64,
  type PublicKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type NotFoundError,
  type RateLimitedError,
  type UnexpectedServerError,
} from '@vexl-next/domain/src/general/commonErrors'
import {
  cryptoBoxSign,
  ecdsaSignE,
  type CryptoError,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Effect, Option, Schema} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {type HttpClientError} from 'effect/unstable/http'
import {type HttpApiSchemaError} from 'effect/unstable/httpapi/HttpApiError'
import {
  type CreateChallengeRequest,
  type CreateChallengeResponse,
  type ErrorSigningChallenge,
  type SignedChallenge,
} from '../../challenges/contracts'

export type RequestWithGeneratableChallenge<T> = Omit<
  T,
  'publicKey' | 'publicKeyV2' | 'signedChallenge'
> & {
  keyPair: PrivateKeyHolder
  keyPairV2?: KeyPairV2
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
  | HttpApiSchemaError
  | SchemaError
  | RateLimitedError
  | NotFoundError
  | UnexpectedServerError
  | HttpClientError.HttpClientError,
  never
>

function generateChallenge2(createChallengeCall: CreateChallengeCall) {
  return (
    publicKey: PublicKeyPemBase64,
    publicKeyV2: Option.Option<PublicKeyV2>
  ) =>
    createChallengeCall({
      payload: {publicKey, publicKeyV2},
    }).pipe(
      Effect.map((one) => one.challenge),
      Effect.mapError((e) => new ErrorGeneratingChallenge({cause: e}))
    )
}

export function addChallengeToRequest2(
  createChallengeCall: CreateChallengeCall
): <
  T extends {
    keyPair: PrivateKeyHolder
    // Kept as optional not Option because eventually we will move to
    // only supporting V2 keys and then it would be easier to just remove the optional..
    keyPairV2?: KeyPairV2
  },
>(
  data: T
) => Effect.Effect<
  Omit<T, 'keyPair' | 'keyPairV2'> & {
    publicKey: PublicKeyPemBase64
    publicKeyV2: Option.Option<PublicKeyV2>
    signedChallenge: SignedChallenge
  },
  ErrorGeneratingChallenge | ErrorSigningChallenge | CryptoError
> {
  return ({keyPair, keyPairV2, ...data}) =>
    Effect.gen(function* () {
      const publicKey = keyPair.publicKeyPemBase64
      const publicKeyV2 = keyPairV2?.publicKey

      const challenge = yield* generateChallenge2(createChallengeCall)(
        publicKey,
        Option.fromNullishOr(publicKeyV2)
      )
      const signature = yield* ecdsaSignE(keyPair.privateKeyPemBase64)(
        challenge
      )

      const signatureV2 = keyPairV2
        ? yield* cryptoBoxSign(keyPairV2.privateKey)(challenge)
        : undefined

      return {
        ...data,
        publicKey,
        publicKeyV2: Option.fromNullishOr(publicKeyV2),
        signedChallenge: {
          challenge,
          signature,
          signatureV2: Option.fromNullishOr(signatureV2),
        },
      }
    })
}
