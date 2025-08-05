import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  UnableToVerifySmsCodeError,
  VerifyCodeErrors,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Either, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
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
    client.initEraseUser({
      body: {
        phoneNumber: phoneNumberToTest,
      },
    })
  )
})

describe('Verify and erase user', () => {
  it('Should erase user when verification successfull', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const initResponse = yield* _(initVerification)

        expect(initResponse.verificationId).toBeDefined()

        checkVerificationMock.mockReturnValueOnce(Effect.succeed('valid'))
        const checkResponse = yield* _(
          client.verifyAndEraseuser({
            body: {
              verificationId: initResponse.verificationId,
              code: '123456',
            },
          })
        )

        expect(
          checkResponse.shortLivedTokenForErasingUserOnContactService
        ).toBeDefined()
      })
    )
  })

  it('Should return error response when verification unsuccessful', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const initResponse = yield* _(initVerification)

        expect(initResponse.verificationId).toBeDefined()

        checkVerificationMock.mockReturnValueOnce(
          Effect.fail(
            new UnableToVerifySmsCodeError({
              reason: 'BadCode' as const,
              status: 400,
              code: '100104',
            })
          )
        )
        const checkResponse = yield* _(
          client.verifyAndEraseuser({
            body: {
              verificationId: initResponse.verificationId,
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
