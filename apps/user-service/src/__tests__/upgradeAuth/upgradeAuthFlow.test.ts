import {cryptobox} from '@vexl-next/cryptography'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {cryptoBoxSign} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {UpgradeAuthInvalidSignatureError} from '@vexl-next/rest-api/src/services/user/contracts'
import {verifyVexlAuthHeader} from '@vexl-next/server-utils/src/serverSecurity'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, pipe, Schema} from 'effect'
import {makeTestCommonAndSecurityHeaders} from '../utils/createTestCommonAndSecurityHeaders'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333333')
const expectUpgradeAuthError = expectErrorResponse(
  UpgradeAuthInvalidSignatureError
)

describe('upgrade auth flow', () => {
  it('should return signed vexl auth header for valid challenge response', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        const oldKeyPair = generatePrivateKey()
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: oldKeyPair.publicKeyPemBase64,
        })
        const headers = makeTestCommonAndSecurityHeaders(authHeaders)
        const v2KeyPair = yield* Effect.promise(
          async () => await cryptobox.generateKeyPair()
        )

        const initResponse = yield* client.UpgradeAuth.initUpgradeAuth({
          headers,
          payload: {
            publicKeyV2: v2KeyPair.publicKey,
          },
        })
        expect(initResponse.challenge).toBeDefined()

        const signature = yield* cryptoBoxSign(v2KeyPair.privateKey)(
          initResponse.challenge
        )

        const submitResponse = yield* client.UpgradeAuth.submitUpgradeAuth({
          headers,
          payload: {
            publicKeyV2: v2KeyPair.publicKey,
            challenge: initResponse.challenge,
            signature,
          },
        })

        expect(submitResponse.vexlAuthHeader.data.hash).toBe(authHeaders.hash)
        expect(submitResponse.vexlAuthHeader.data.pk).toBe(v2KeyPair.publicKey)
        expect(
          (yield* pipe(
            verifyVexlAuthHeader(submitResponse.vexlAuthHeader),
            Effect.result
          ))._tag
        ).toBe('Success')
      })
    )
  })

  it('should fail when challenge response is signed by a different key', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        const oldKeyPair = generatePrivateKey()
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: oldKeyPair.publicKeyPemBase64,
        })
        const headers = makeTestCommonAndSecurityHeaders(authHeaders)

        const v2KeyPair = yield* Effect.promise(
          async () => await cryptobox.generateKeyPair()
        )
        const wrongSignerKeyPair = yield* Effect.promise(
          async () => await cryptobox.generateKeyPair()
        )

        const initResponse = yield* client.UpgradeAuth.initUpgradeAuth({
          headers,
          payload: {
            publicKeyV2: v2KeyPair.publicKey,
          },
        })

        const wrongSignature = yield* cryptoBoxSign(
          wrongSignerKeyPair.privateKey
        )(initResponse.challenge)

        const submitResponse = yield* pipe(
          client.UpgradeAuth.submitUpgradeAuth({
            headers,
            payload: {
              publicKeyV2: v2KeyPair.publicKey,
              challenge: initResponse.challenge,
              signature: wrongSignature,
            },
          }),
          Effect.result
        )

        expectUpgradeAuthError(submitResponse)
      })
    )
  })

  it('should fail when challenge was created for a different public key', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        const oldKeyPair = generatePrivateKey()
        const authHeaders = yield* createDummyAuthHeadersForUser({
          phoneNumber,
          publicKey: oldKeyPair.publicKeyPemBase64,
        })
        const headers = makeTestCommonAndSecurityHeaders(authHeaders)
        const v2KeyPair = yield* Effect.promise(
          async () => await cryptobox.generateKeyPair()
        )
        const otherV2KeyPair = yield* Effect.promise(
          async () => await cryptobox.generateKeyPair()
        )

        const initResponse = yield* client.UpgradeAuth.initUpgradeAuth({
          headers,
          payload: {
            publicKeyV2: otherV2KeyPair.publicKey,
          },
        })

        const signature = yield* cryptoBoxSign(v2KeyPair.privateKey)(
          initResponse.challenge
        )

        const submitResponse = yield* pipe(
          client.UpgradeAuth.submitUpgradeAuth({
            headers,
            payload: {
              publicKeyV2: v2KeyPair.publicKey,
              challenge: initResponse.challenge,
              signature,
            },
          }),
          Effect.result
        )

        expectUpgradeAuthError(submitResponse)
      })
    )
  })
})
