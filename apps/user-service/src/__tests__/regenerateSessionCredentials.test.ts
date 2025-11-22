import {
  generatePrivateKey,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  HashedPhoneNumberE,
  type HashedPhoneNumber,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  hmacSignE,
  type EcdsaSignature,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
// import {verifyUserSecurity} from '@vexl-next/server-utils/src/serverSecurity'
import {NumberDoesNotMatchOldHashError} from '@vexl-next/rest-api/src/services/user/contracts'
import {generateUserAuthData} from '@vexl-next/server-utils/src/generateUserAuthData'
import {verifyUserSecurity} from '@vexl-next/server-utils/src/serverSecurity'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {cryptoConfig, oldHmacKeyUsedForHashingNumbersConfig} from '../configs'
import {NodeTestingApp} from './utils/NodeTestingApp'
import {makeTestCommonAndSecurityHeaders} from './utils/createTestCommonAndSecurityHeaders'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from './utils/runPromiseInMockedEnvironment'

beforeAll(startRuntime)
afterAll(disposeRuntime)

describe('Regenerate session credentials', () => {
  // Simulated session data with bad hash
  let hash: HashedPhoneNumber
  let publicKey: PublicKeyPemBase64
  let signature: EcdsaSignature

  beforeAll(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const keys = generatePrivateKey()
        const phoneNumber = Schema.decodeSync(E164PhoneNumberE)('+420777777777')
        const wronglyHashedNumber = yield* _(
          oldHmacKeyUsedForHashingNumbersConfig.pipe(
            Effect.flatMap((oldHmacKey) => hmacSignE(oldHmacKey)(phoneNumber)),
            Effect.flatMap(Schema.decode(HashedPhoneNumberE))
          )
        )

        const sessionData = yield* _(
          generateUserAuthData({
            phoneNumberHashed: wronglyHashedNumber,
            publicKey: keys.publicKeyPemBase64,
          })
        )

        hash = sessionData.hash
        publicKey = keys.publicKeyPemBase64
        signature = sessionData.signature
      })
    )
  })

  it('Will not regenerate credentials when trying to use different number', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const authHeaders = {
          'public-key': publicKey,
          hash,
          signature,
        }

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* _(
          client.regenerateSessionCredentials({
            payload: {
              myPhoneNumber:
                Schema.decodeSync(E164PhoneNumberE)('+420777777778'),
            },
            headers: commonAndSecurityHeaders,
          }),
          Effect.either
        )

        expectErrorResponse(NumberDoesNotMatchOldHashError)(response)
      })
    )
  })

  it('Genreates a valid credentials with proper hash', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const phoneNumber = Schema.decodeSync(E164PhoneNumberE)('+420777777777')

        const authHeaders = {
          'public-key': publicKey,
          hash,
          signature,
        }

        yield* _(setAuthHeaders(authHeaders))

        const commonAndSecurityHeaders =
          makeTestCommonAndSecurityHeaders(authHeaders)

        const response = yield* _(
          client.regenerateSessionCredentials({
            payload: {
              myPhoneNumber: phoneNumber,
            },
            headers: commonAndSecurityHeaders,
          })
        )

        const properKey = yield* _(cryptoConfig.hmacKey)
        const expectedHash = yield* _(hmacSignE(properKey)(phoneNumber))
        expect(response.hash).toEqual(expectedHash)

        const securityHeaders = yield* _(
          verifyUserSecurity({
            'public-key': publicKey,
            hash: response.hash,
            signature: response.signature,
          }),
          Effect.either
        )

        expect(securityHeaders._tag).toBe('Right')
      })
    )
  })
})
