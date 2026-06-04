import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  InvalidVerificationError,
  InvalidVerificationIdError,
  TurnstileToken,
  UnableToGenerateChallengeError,
  UnableToVerifySmsCodeError,
  VerificationNotFoundError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, Either, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {
  checkVerificationMock,
  createVerificationMock,
} from '../utils/mockedPreludeClient'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const phoneNumberToTest = Schema.decodeSync(E164PhoneNumber)('+420733333333')
const validTurnstileToken = Schema.decodeSync(TurnstileToken)(
  'valid-turnstile-token'
)
const VerifyCodeErrors = Schema.Union(
  UnableToGenerateChallengeError,
  VerificationNotFoundError,
  InvalidVerificationError,
  InvalidVerificationIdError,
  UnableToVerifySmsCodeError
)

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
        turnstileToken: validTurnstileToken,
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

  it('Should reject replayed erase verification ids', async () => {
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

        const replayResponse = yield* _(
          client.EraseUser.verifyAndEraseuser({
            payload: {
              verificationId: initResponse.verificationId,
              code: '123456',
            },
          }),
          Effect.either
        )

        expectErrorResponse(VerifyCodeErrors)(replayResponse)
      })
    )
  })

  it('Should atomically reject concurrent replayed erase verification ids', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const initResponse = yield* _(initVerification)

        expect(initResponse.verificationId).toBeDefined()

        checkVerificationMock.mockReturnValue(Effect.succeed('valid'))
        const verifyRequest = client.EraseUser.verifyAndEraseuser({
          payload: {
            verificationId: initResponse.verificationId,
            code: '123456',
          },
        }).pipe(Effect.either)

        const [firstResponse, secondResponse] = yield* _(
          Effect.all([verifyRequest, verifyRequest], {concurrency: 'unbounded'})
        )

        const successCount =
          Number(Either.isRight(firstResponse)) +
          Number(Either.isRight(secondResponse))
        expect(successCount).toBe(1)

        const failedResponse = Either.isLeft(firstResponse)
          ? firstResponse
          : secondResponse

        expectErrorResponse(VerifyCodeErrors)(failedResponse)
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
              reason: 'BadCode',
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

        expectErrorResponse(VerifyCodeErrors)(checkResponse)
      })
    )
  })
})
