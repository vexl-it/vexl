import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  UnableToVerifySmsCodeError,
  VerifyCodeErrors,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Either, Schema} from 'effect'
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
    client.initVerification({
      headers: Schema.decodeSync(CommonHeaders)({
        'user-agent': 'Vexl/2 (1.0.0) IOS',
      }),
      body: {
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
          client.verifyCode({
            body: {
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
          client.verifyCode({
            body: {
              userPublicKey: keypair.publicKeyPemBase64,
              id: initResponse.verificationId,
              code: '123456',
            },
          }),
          Effect.either
        )

        if (Either.isRight(checkResponse)) {
          expect(checkResponse._tag).toBe('Right')
          return
        }
        const error = yield* _(
          checkResponse.left.error,
          Schema.decodeUnknown(VerifyCodeErrors)
        )
        expect(error._tag).toBe('UnableToVerifySmsCodeError')
        if (error._tag === 'UnableToVerifySmsCodeError') {
          expect(error.reason).toBe('BadCode')
        }
      })
    )
  })
})
