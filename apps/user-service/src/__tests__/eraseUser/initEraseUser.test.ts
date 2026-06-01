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
import {Effect, Schema} from 'effect'
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
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const data = yield* _(
          client.EraseUser.initEraseUser({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            payload: {
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
              turnstileToken: validTurnstileToken,
            },
          })
        )

        expect(verifyTurnstileTokenMock).toHaveBeenCalledWith({
          expectedAction: 'delete-account-init',
          token: 'valid-turnstile-token',
        })
        expect(createVerificationMock).toHaveBeenCalledWith(
          '+420733333333',
          expect.anything()
        )
        expect(data.verificationId).toBeDefined()
        const crypto = yield* _(ServerCrypto)
        const tokenPayload = yield* _(
          crypto.decryptAES(VerificationIdPayload)(
            Schema.decodeSync(AesGtmCypher)(data.verificationId)
          )
        )
        expect(tokenPayload.phoneNumber).toEqual('+420733333333')
        expect(tokenPayload.expiresAt).toBeDefined()
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
          client.EraseUser.initEraseUser({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            payload: {
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
              turnstileToken: validTurnstileToken,
            },
          }),
          Effect.either
        )

        expectErrorResponse(UnableToSendVerificationSmsError)(result)
      })
    )
  })

  it('Rejects request when turnstile verification fails', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        verifyTurnstileTokenMock.mockReturnValueOnce(
          Effect.fail(
            new TurnstileVerificationError({
              reason: 'InvalidToken',
              status: 400,
            })
          )
        )

        const result = yield* _(
          client.EraseUser.initEraseUser({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            payload: {
              phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420733333333'),
              turnstileToken: invalidTurnstileToken,
            },
          }),
          Effect.either
        )

        expect(createVerificationMock).not.toHaveBeenCalled()
        expectErrorResponse(TurnstileVerificationError)(result)
      })
    )
  })
})
