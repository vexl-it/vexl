import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  InitVerificationErrors,
  UnableToSendVerificationSmsError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {Effect, Schema} from 'effect'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {
  checkVerificationMock,
  createVerificationMock,
} from '../utils/mockedTwilioClient'
import {
  disposeRuntime,
  runPromiseInMockedEnvironment,
  startRuntime,
} from '../utils/runPromiseInMockedEnvironment'

beforeAll(startRuntime)
afterAll(disposeRuntime)

beforeEach(() => {
  createVerificationMock.mockClear()
  checkVerificationMock.mockClear()
})

describe('Initialize verification', () => {
  it('Issues sms code when requested', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const data = yield* _(
          client.initVerification({
            body: {
              phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            },
          })
        )

        expect(createVerificationMock).toBeCalledWith('+420733333333')

        expect(data.verificationId).toBeDefined()
        expect(data.expirationAt).toBeDefined()
      })
    )
  })

  it('Does not call twilio when verifying dummy number', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const data = yield* _(
          client.initVerification({
            body: {
              phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333331'),
            },
          })
        )

        expect(createVerificationMock).not.toBeCalled()
        expect(data.verificationId).toBeDefined()
        expect(data.expirationAt).toBeDefined()
      })
    )
  })

  it('Properly report error when twilio call fails', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        createVerificationMock.mockReturnValue(
          Effect.fail(
            new UnableToSendVerificationSmsError({
              reason: 'InvalidPhoneNumber',
              status: 400,
            })
          )
        )

        const result = yield* _(
          client.initVerification({
            body: {
              phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            },
          }),
          Effect.either
        )
        if (result._tag === 'Right') {
          expect('Expected error').toBe('Got success')
          return
        }
        const receivedError = yield* _(
          Schema.decodeUnknown(InitVerificationErrors)(result.left.error)
        )
        expect(receivedError.reason).toEqual('InvalidPhoneNumber')
      })
    )
  })
})
