import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  InvalidVerificationError,
  InvalidVerificationIdError,
  UnableToGenerateChallengeError,
  UnableToVerifySmsCodeError,
  VerificationNotFoundError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {generateAndSignChallenge} from '../utils/loginChalenge'
import {
  checkVerificationMock,
  createVerificationMock,
} from '../utils/mockedPreludeClient'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from '../utils/runPromiseInMockedEnvironment'

beforeAll(startRuntime)
afterAll(disposeRuntime)

const phoneNumberToTest = Schema.decodeSync(E164PhoneNumberE)('+420733333333')

beforeEach(() => {
  createVerificationMock.mockClear()
  checkVerificationMock.mockClear()
})

const initVerification = Effect.gen(function* (_) {
  const client = yield* _(NodeTestingApp)
  return yield* _(
    client.Login.initVerification({
      headers: Schema.decodeSync(CommonHeaders)({
        'user-agent': 'Vexl/2 (1.0.0) IOS',
      }),
      payload: {
        challenge: yield* _(generateAndSignChallenge),
        phoneNumber: phoneNumberToTest,
      },
    })
  )
})

describe('Verify code', () => {
  it('Should return success response when verification is successfull', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const initResponse = yield* _(initVerification)

        expect(initResponse.verificationId).toBeDefined()
        expect(initResponse.expirationAt).toBeDefined()

        checkVerificationMock.mockReturnValueOnce(Effect.succeed('valid'))
        const keypair = generatePrivateKey()
        const checkResponse = yield* _(
          client.Login.verifyCode({
            payload: {
              userPublicKey: keypair.publicKeyPemBase64,
              id: initResponse.verificationId,
              code: '123456',
            },
          })
        )

        expect(checkResponse.challenge).toBeDefined()
      })
    )
  })

  it('Should return error response when verification unsuccessful', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const initResponse = yield* _(initVerification)

        expect(initResponse.verificationId).toBeDefined()
        expect(initResponse.expirationAt).toBeDefined()

        checkVerificationMock.mockReturnValueOnce(
          Effect.fail(
            new UnableToVerifySmsCodeError({
              reason: 'BadCode' as const,
              status: 400,
              code: '100104',
            })
          )
        )
        const keypair = generatePrivateKey()
        const checkResponse = yield* _(
          client.Login.verifyCode({
            payload: {
              userPublicKey: keypair.publicKeyPemBase64,
              id: initResponse.verificationId,
              code: '123456',
            },
          }),
          Effect.either
        )

        const VerifyCodeErrors = Schema.Union(
          UnableToGenerateChallengeError,
          VerificationNotFoundError,
          InvalidVerificationError,
          InvalidVerificationIdError,
          UnableToVerifySmsCodeError
        )

        expectErrorResponse(VerifyCodeErrors)(checkResponse)
      })
    )
  })
})
