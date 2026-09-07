import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {AesGtmCypher} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  TurnstileToken,
  TurnstileVerificationError,
  UnableToSendVerificationSmsError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, pipe, Schema} from 'effect'
import {VerificationIdPayload} from '../../routes/eraseUser/utils'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {
  checkVerificationMock,
  createVerificationMock,
} from '../utils/mockedPreludeClient'
import {verifyTurnstileTokenMock} from '../utils/mockedTurnstileClient'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

beforeEach(() => {
  createVerificationMock.mockClear()
  checkVerificationMock.mockClear()
  verifyTurnstileTokenMock.mockClear()
})

const validTurnstileToken = Schema.decodeSync(TurnstileToken)(
  'valid-turnstile-token'
)
const invalidTurnstileToken = Schema.decodeSync(TurnstileToken)(
  'invalid-turnstile-token'
)

describe('Initialize erase user', () => {
  it('Issues sms code when requested', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        const data = yield* client.EraseUser.initEraseUser({
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
          payload: {
            phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
            turnstileToken: validTurnstileToken,
          },
        })

        expect(verifyTurnstileTokenMock).toHaveBeenCalledWith({
          expectedAction: 'delete-account-init',
          token: 'valid-turnstile-token',
        })
        expect(createVerificationMock).toHaveBeenCalledWith(
          '+420733333333',
          expect.anything()
        )
        expect(data.verificationId).toBeDefined()
        const crypto = yield* ServerCrypto
        const tokenPayload = yield* crypto.decryptAES(VerificationIdPayload)(
          Schema.decodeSync(AesGtmCypher)(data.verificationId)
        )
        expect(tokenPayload.phoneNumber).toEqual('+420733333333')
        expect(tokenPayload.expiresAt).toBeDefined()
      })
    )
  })

  it('Properly report error when twilio call fails', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        createVerificationMock.mockReturnValue(
          Effect.fail(
            new UnableToSendVerificationSmsError({
              reason: 'InvalidPhoneNumber',
              status: 400,
            })
          )
        )

        const result = yield* pipe(
          client.EraseUser.initEraseUser({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            payload: {
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
              turnstileToken: validTurnstileToken,
            },
          }),
          Effect.result
        )

        expectErrorResponse(UnableToSendVerificationSmsError)(result)
      })
    )
  })

  it('Rejects request when turnstile verification fails', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        verifyTurnstileTokenMock.mockReturnValueOnce(
          Effect.fail(
            new TurnstileVerificationError({
              reason: 'InvalidToken',
              status: 400,
            })
          )
        )

        const result = yield* pipe(
          client.EraseUser.initEraseUser({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            payload: {
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
              turnstileToken: invalidTurnstileToken,
            },
          }),
          Effect.result
        )

        expect(createVerificationMock).not.toHaveBeenCalled()
        expectErrorResponse(TurnstileVerificationError)(result)
      })
    )
  })
})
