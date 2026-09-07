import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {
  InvalidLoginSignatureError,
  type LoginChallengeClientSignature,
  type LoginChallengeServerSignature,
} from '@vexl-next/domain/src/general/loginChallenge'
import {signLoginChallenge} from '@vexl-next/resources-utils/src/loginChallenge'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  UnableToSendVerificationSmsError,
  UnsupportedVersionToLoginError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {generateAndSignLoginChallenge} from '@vexl-next/server-utils/src/loginChallengeServerOperations'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, pipe, Schema} from 'effect'
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

beforeEach(() => {
  createVerificationMock.mockClear()
  checkVerificationMock.mockClear()
})

const smsProviderErrorReasons: ReadonlyArray<
  UnableToSendVerificationSmsError['reason']
> = [
  'InvalidPhoneNumber',
  'CarrierError',
  'UnsupportedCarrier',
  'AntiFraudBlock',
  'AntiFraudBlock12h',
  'AntiFraudBlockGeo',
  'MaxAttemptsReached',
  'NumberDoesNotSupportSms',
  'Other',
]

describe('Initialize verification', () => {
  it('Issues sms code when requested', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const challenge = yield* generateAndSignChallenge

        const data = yield* client.Login.initVerification({
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
          payload: {
            challenge,
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
          },
        })

        expect(createVerificationMock).toHaveBeenCalledWith(
          '+420733333333',
          expect.anything()
        )

        expect(data.verificationId).toBeDefined()
        expect(data.expirationAt).toBeDefined()
      })
    )
  })

  it('fails when called with unsupported version', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const challenge = yield* generateAndSignChallenge

        const data = yield* pipe(
          client.Login.initVerification({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) IOS',
            }),
            payload: {
              challenge,
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            },
          }),
          Effect.result
        )

        expectErrorResponse(UnsupportedVersionToLoginError)(data)
      })
    )
  })

  it('fails when called with bad client signature', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const challenge = yield* generateAndSignChallenge

        const data = yield* pipe(
          client.Login.initVerification({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            payload: {
              challenge: {
                ...challenge,
                clientSignature: 'bad' as LoginChallengeClientSignature,
              },
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            },
          }),
          Effect.result
        )

        expectErrorResponse(InvalidLoginSignatureError)(data)
      })
    )
  })

  it('fails when called with bad server signature', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const challenge = yield* generateAndSignChallenge

        const data = yield* pipe(
          client.Login.initVerification({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            payload: {
              challenge: {
                ...challenge,
                serverSignature: 'bad' as LoginChallengeServerSignature,
              },
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            },
          }),
          Effect.result
        )

        expectErrorResponse(InvalidLoginSignatureError)(data)
      })
    )
  })

  it('fails when called with expired server challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const challenge = yield* generateAndSignLoginChallenge(-2)
        const clientSignature = yield* signLoginChallenge(
          challenge.encodedChallenge
        )

        const data = yield* pipe(
          client.Login.initVerification({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            payload: {
              challenge: {
                challenge: challenge.encodedChallenge,
                clientSignature,
                serverSignature: 'bad' as LoginChallengeServerSignature,
              },
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            },
          }),
          Effect.result
        )

        expectErrorResponse(InvalidLoginSignatureError)(data)
      })
    )
  })

  it('Does not call twilio when verifying dummy number', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        const challenge = yield* generateAndSignChallenge

        const data = yield* client.Login.initVerification({
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
          payload: {
            challenge,
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333331'),
          },
        })

        expect(createVerificationMock).not.toHaveBeenCalled()
        expect(data.verificationId).toBeDefined()
        expect(data.expirationAt).toBeDefined()
      })
    )
  })

  it.each(smsProviderErrorReasons)(
    'does not return verification data for %s provider errors',
    async (reason) => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp
          const challenge = yield* generateAndSignChallenge

          createVerificationMock.mockReturnValue(
            Effect.fail(
              new UnableToSendVerificationSmsError({
                reason,
                status: 400,
              })
            )
          )

          const result = yield* pipe(
            client.Login.initVerification({
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/2 (1.0.0) IOS',
              }),
              payload: {
                challenge,
                phoneNumber:
                  Schema.decodeSync(E164PhoneNumber)('+420733333333'),
              },
            }),
            Effect.result
          )

          expectErrorResponse(UnableToSendVerificationSmsError)(result)

          if (result._tag !== 'Failure') return
          if (!Schema.is(UnableToSendVerificationSmsError)(result.failure))
            return

          expect(result.failure.verificationId).toBeUndefined()
          expect(result.failure.expirationAt).toBeUndefined()
        })
      )
    }
  )
})
