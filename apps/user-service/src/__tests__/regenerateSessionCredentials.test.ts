import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {
  generatePrivateKey,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  type HashedPhoneNumber,
  HashedPhoneNumberE,
} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  type EcdsaSignature,
  hmacSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {verifyUserSecurity} from '@vexl-next/rest-api/src/apiSecurity'
import {generateUserAuthData} from '@vexl-next/server-utils/src/generateUserAuthData'
import {Effect} from 'effect'
import {cryptoConfig, oldHmacKeyUsedForHashingNumbersConfig} from '../configs'
import {NodeTestingApp} from './utils/NodeTestingApp'
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
        const response = yield* _(
          client.regenerateSessionCredentials(
            {
              body: {
                myPhoneNumber:
                  Schema.decodeSync(E164PhoneNumberE)('+420777777778'),
              },
            },
            HttpClientRequest.setHeaders({
              'public-key': publicKey,
              hash,
              signature,
            })
          ),
          Effect.either
        )

        expect(response._tag).toBe('Left')
        if (response._tag !== 'Left') return

        expect(response.left.error).toHaveProperty(
          '_tag',
          'NumberDoesNotMatchOldHashError'
        )
      })
    )
  })

  it('Genreates a valid credentials with proper hash', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const phoneNumber = Schema.decodeSync(E164PhoneNumberE)('+420777777777')
        const response = yield* _(
          client.regenerateSessionCredentials(
            {
              body: {
                myPhoneNumber: phoneNumber,
              },
            },
            HttpClientRequest.setHeaders({
              'public-key': publicKey,
              hash,
              signature,
            })
          )
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
