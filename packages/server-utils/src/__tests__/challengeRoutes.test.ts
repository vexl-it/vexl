import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer'
import {cryptobox} from '@vexl-next/cryptography'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {ChallengeApiSpecification} from '@vexl-next/rest-api/src/challenges/specification'
import {Effect, Layer, Option} from 'effect'
import {HttpRouter, type HttpClient} from 'effect/unstable/http'
import {HttpApiBuilder, HttpApiClient} from 'effect/unstable/httpapi'
import {ServerCrypto} from '../ServerCrypto'
import {cryptoConfig} from '../commonConfigs'
import {createChallenge} from '../services/challenge/routes/createChalenge'
import {createChallenges} from '../services/challenge/routes/createChallenges'
import {ChallengePayload} from '../services/challenge/utils/challengePayload'

const Client = HttpApiClient.make(ChallengeApiSpecification)

const ChallengesLive = HttpApiBuilder.group(
  ChallengeApiSpecification,
  'Challenges',
  (h) =>
    h
      .handle('createChallenge', createChallenge)
      .handle('createChallengeBatch', createChallenges)
)

const ChallengeApiLive = HttpApiBuilder.layer(ChallengeApiSpecification).pipe(
  Layer.provide(ChallengesLive)
)

const TestServerLive = HttpRouter.serve(ChallengeApiLive).pipe(
  Layer.provideMerge(NodeHttpServer.layerTest),
  Layer.provide(ServerCrypto.layer(cryptoConfig))
)

const runWithChallengeApi = async <A, E>(
  effectToRun: Effect.Effect<A, E, HttpClient.HttpClient | ServerCrypto>
): Promise<A> =>
  await Effect.runPromise(
    effectToRun.pipe(
      Effect.provide(
        Layer.mergeAll(TestServerLive, ServerCrypto.layer(cryptoConfig))
      )
    )
  )

describe('challenge routes', () => {
  it('createChallenge should seal challenge payload with v1 and v2 keys', async () => {
    await runWithChallengeApi(
      Effect.gen(function* () {
        const app = yield* Client
        const serverCrypto = yield* ServerCrypto
        const keyPairV1 = generatePrivateKey()
        const keyPairV2 = yield* Effect.promise(
          async () => await cryptobox.generateKeyPair()
        )

        const response = yield* app.Challenges.createChallenge({
          payload: {
            publicKey: keyPairV1.publicKeyPemBase64,
            publicKeyV2: Option.some(keyPairV2.publicKey),
          },
        })

        expect(response.expiration).toBeGreaterThan(unixMillisecondsNow())

        const decodedPayload = yield* serverCrypto.cryptoBoxUnseal(
          ChallengePayload
        )(response.challenge)

        expect(decodedPayload.publicKey).toEqual(keyPairV1.publicKeyPemBase64)
        expect(decodedPayload.publicKeyV2).toEqual(
          Option.some(keyPairV2.publicKey)
        )
        expect(decodedPayload.expiresAt).toEqual(response.expiration)
      })
    )
  })

  it('createChallenge should work without publicKeyV2', async () => {
    await runWithChallengeApi(
      Effect.gen(function* () {
        const app = yield* Client
        const serverCrypto = yield* ServerCrypto
        const keyPairV1 = generatePrivateKey()

        const response = yield* app.Challenges.createChallenge({
          payload: {
            publicKey: keyPairV1.publicKeyPemBase64,
            publicKeyV2: Option.none(),
          },
        })

        const decodedPayload = yield* serverCrypto.cryptoBoxUnseal(
          ChallengePayload
        )(response.challenge)

        expect(decodedPayload.publicKey).toEqual(keyPairV1.publicKeyPemBase64)
        expect(Option.isNone(decodedPayload.publicKeyV2)).toBe(true)
        expect(decodedPayload.expiresAt).toEqual(response.expiration)
      })
    )
  })

  it('createChallengeBatch should return encrypted challenge for each public key', async () => {
    await runWithChallengeApi(
      Effect.gen(function* () {
        const app = yield* Client
        const serverCrypto = yield* ServerCrypto

        const firstPublicKey = generatePrivateKey().publicKeyPemBase64
        const secondPublicKey = generatePrivateKey().publicKeyPemBase64
        const thirdPublicKey = generatePrivateKey().publicKeyPemBase64

        const response = yield* app.Challenges.createChallengeBatch({
          payload: {
            publicKeys: [firstPublicKey, secondPublicKey, thirdPublicKey],
          },
        })

        expect(response.expiration).toBeGreaterThan(unixMillisecondsNow())
        expect(response.challenges).toHaveLength(3)

        for (const challengeResponse of response.challenges) {
          const decodedPayload = yield* serverCrypto.cryptoBoxUnseal(
            ChallengePayload
          )(challengeResponse.challenge)

          expect(decodedPayload.publicKey).toEqual(challengeResponse.publicKey)
          expect(Option.isNone(decodedPayload.publicKeyV2)).toBe(true)
          expect(decodedPayload.expiresAt).toEqual(response.expiration)
        }
      })
    )
  })
})
