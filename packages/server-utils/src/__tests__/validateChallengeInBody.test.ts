import {cryptobox} from '@vexl-next/cryptography'
import {
  generatePrivateKey,
  type KeyPairV2,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  type UnixMilliseconds,
  unixMillisecondsFromNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  cryptoBoxSign,
  ecdsaSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {type RequestBaseWithChallenge} from '@vexl-next/rest-api/src/challenges/contracts'
import {Effect, Option} from 'effect'
import {ServerCrypto} from '../ServerCrypto'
import {cryptoConfig} from '../commonConfigs'
import {sealChallenge} from '../services/challenge/utils/sealChallenge'
import {validateChallengeInBody} from '../services/challenge/utils/validateChallengeInBody'

const runWithServerCrypto = async <A, E>(
  effectToRun: Effect.Effect<A, E, ServerCrypto>
): Promise<A> =>
  await Effect.runPromise(
    effectToRun.pipe(Effect.provide(ServerCrypto.layer(cryptoConfig)))
  )

const createSignedChallengeRequest = ({
  keyPair,
  keyPairV2 = Option.none(),
  expiresAt,
}: {
  keyPair: PrivateKeyHolder
  keyPairV2?: Option.Option<KeyPairV2>
  expiresAt: UnixMilliseconds
}): Effect.Effect<RequestBaseWithChallenge, unknown, ServerCrypto> =>
  Effect.gen(function* (_) {
    const publicKey = keyPair.publicKeyPemBase64
    const publicKeyV2 = Option.map(keyPairV2, (v) => v.publicKey)
    const challenge = yield* _(
      sealChallenge({
        publicKey,
        publicKeyV2,
        expiresAt,
      })
    )
    const signature = yield* _(
      ecdsaSignE(keyPair.privateKeyPemBase64)(challenge)
    )

    if (Option.isSome(keyPairV2)) {
      const signatureV2 = yield* _(
        cryptoBoxSign(keyPairV2.value.privateKey)(challenge)
      )
      return {
        publicKey,
        publicKeyV2,
        signedChallenge: {
          challenge,
          signature,
          signatureV2: Option.some(signatureV2),
        },
      }
    }

    return {
      publicKey,
      publicKeyV2,
      signedChallenge: {
        challenge,
        signature,
        signatureV2: Option.none(),
      },
    }
  })

describe('validateChallengeInBody', () => {
  it('should pass for valid v1 challenge', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = generatePrivateKey()
        const request = yield* _(
          createSignedChallengeRequest({
            keyPair,
            expiresAt: unixMillisecondsFromNow(60_000),
          })
        )

        const result = yield* _(validateChallengeInBody(request), Effect.either)

        expect(result._tag).toEqual('Right')
      })
    )
  })

  it('should fail when challenge has expired', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = generatePrivateKey()
        const request = yield* _(
          createSignedChallengeRequest({
            keyPair,
            expiresAt: unixMillisecondsFromNow(-1_000),
          })
        )

        const result = yield* _(validateChallengeInBody(request), Effect.either)

        expect(result._tag).toEqual('Left')
        if (result._tag === 'Left') {
          expect(result.left._tag).toEqual('InvalidChallengeError')
        }
      })
    )
  })

  it('should fail when request public key does not match challenge payload', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = generatePrivateKey()
        const request = yield* _(
          createSignedChallengeRequest({
            keyPair,
            expiresAt: unixMillisecondsFromNow(60_000),
          })
        )

        const mismatchedRequest: RequestBaseWithChallenge = {
          publicKey: generatePrivateKey().publicKeyPemBase64,
          publicKeyV2: request.publicKeyV2,
          signedChallenge: request.signedChallenge,
        }

        const result = yield* _(
          validateChallengeInBody(mismatchedRequest),
          Effect.either
        )

        expect(result._tag).toEqual('Left')
        if (result._tag === 'Left') {
          expect(result.left._tag).toEqual('InvalidChallengeError')
        }
      })
    )
  })

  it('should fail when v1 signature does not match challenge', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = generatePrivateKey()
        const request = yield* _(
          createSignedChallengeRequest({
            keyPair,
            expiresAt: unixMillisecondsFromNow(60_000),
          })
        )

        const secondRequest = yield* _(
          createSignedChallengeRequest({
            keyPair,
            expiresAt: unixMillisecondsFromNow(60_000),
          })
        )

        const invalidSignatureRequest: RequestBaseWithChallenge = {
          publicKey: request.publicKey,
          publicKeyV2: request.publicKeyV2,
          signedChallenge: {
            challenge: request.signedChallenge.challenge,
            signature: secondRequest.signedChallenge.signature,
            signatureV2: request.signedChallenge.signatureV2,
          },
        }

        const result = yield* _(
          validateChallengeInBody(invalidSignatureRequest),
          Effect.either
        )

        expect(result._tag).toEqual('Left')
        if (result._tag === 'Left') {
          expect(result.left._tag).toEqual('InvalidChallengeError')
        }
      })
    )
  })

  it('should pass for valid v2 challenge with v2 signature', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = generatePrivateKey()
        const keyPairV2 = yield* _(
          Effect.promise(async () => await cryptobox.generateKeyPair())
        )
        const request = yield* _(
          createSignedChallengeRequest({
            keyPair,
            keyPairV2: Option.some(keyPairV2),
            expiresAt: unixMillisecondsFromNow(60_000),
          })
        )

        const result = yield* _(validateChallengeInBody(request), Effect.either)

        expect(result._tag).toEqual('Right')
      })
    )
  })

  it('should fail when publicKeyV2 is present but v2 signature is missing', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = generatePrivateKey()
        const keyPairV2 = yield* _(
          Effect.promise(async () => await cryptobox.generateKeyPair())
        )
        const request = yield* _(
          createSignedChallengeRequest({
            keyPair,
            keyPairV2: Option.some(keyPairV2),
            expiresAt: unixMillisecondsFromNow(60_000),
          })
        )

        const missingV2SignatureRequest: RequestBaseWithChallenge = {
          publicKey: request.publicKey,
          publicKeyV2: request.publicKeyV2,
          signedChallenge: {
            challenge: request.signedChallenge.challenge,
            signature: request.signedChallenge.signature,
            signatureV2: Option.none(),
          },
        }

        const result = yield* _(
          validateChallengeInBody(missingV2SignatureRequest),
          Effect.either
        )

        expect(result._tag).toEqual('Left')
        if (result._tag === 'Left') {
          expect(result.left._tag).toEqual('InvalidChallengeError')
        }
      })
    )
  })

  it('should fail when v2 signature does not match challenge', async () => {
    await runWithServerCrypto(
      Effect.gen(function* (_) {
        const keyPair = generatePrivateKey()
        const keyPairV2 = yield* _(
          Effect.promise(async () => await cryptobox.generateKeyPair())
        )

        const request = yield* _(
          createSignedChallengeRequest({
            keyPair,
            keyPairV2: Option.some(keyPairV2),
            expiresAt: unixMillisecondsFromNow(60_000),
          })
        )
        const secondRequest = yield* _(
          createSignedChallengeRequest({
            keyPair,
            keyPairV2: Option.some(keyPairV2),
            expiresAt: unixMillisecondsFromNow(60_000),
          })
        )

        if (
          Option.isNone(request.signedChallenge.signatureV2) ||
          Option.isNone(secondRequest.signedChallenge.signatureV2)
        ) {
          throw new Error('Expected v2 signatures to be present')
        }

        const invalidV2SignatureRequest: RequestBaseWithChallenge = {
          publicKey: request.publicKey,
          publicKeyV2: request.publicKeyV2,
          signedChallenge: {
            challenge: request.signedChallenge.challenge,
            signature: request.signedChallenge.signature,
            signatureV2: secondRequest.signedChallenge.signatureV2,
          },
        }

        const result = yield* _(
          validateChallengeInBody(invalidV2SignatureRequest),
          Effect.either
        )

        expect(result._tag).toEqual('Left')
        if (result._tag === 'Left') {
          expect(result.left._tag).toEqual('InvalidChallengeError')
        }
      })
    )
  })
})
