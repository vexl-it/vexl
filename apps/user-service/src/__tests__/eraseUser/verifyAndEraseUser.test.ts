import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
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
import {
  checkVerificationMock,
  createVerificationMock,
} from '../utils/mockedPreludeClient'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const phoneNumberToTest = Schema.decodeSync(E164PhoneNumber)('+420733333333')

beforeEach(() => {
  createVerificationMock.mockClear()
  checkVerificationMock.mockClear()
})

const initVerification = Effect.gen(function* (_) {
  const client = yield* _(NodeTestingApp)
  return yield* _(
    client.EraseUser.initEraseUser({
      headers: Schema.decodeSync(CommonHeaders)({
        'user-agent': 'Vexl/2 (1.0.0) IOS',
      }),
      payload: {
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
          client.EraseUser.verifyAndEraseuser({
            payload: {
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
          client.EraseUser.verifyAndEraseuser({
            payload: {
              verificationId: initResponse.verificationId,
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
