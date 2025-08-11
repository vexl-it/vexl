import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {AesGtmCypher} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  InitVerificationErrors,
  UnableToSendVerificationSmsError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {ServerCrypto} from '@vexl-next/server-utils/src/ServerCrypto'
import {Effect, Schema} from 'effect'
import {VerificationIdPayload} from '../../routes/eraseUser/utils'
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

beforeEach(() => {
  createVerificationMock.mockClear()
  checkVerificationMock.mockClear()
})

describe('Initialize erase user', () => {
  it('Issues sms code when requested', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const data = yield* _(
          client.initEraseUser({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            body: {
              phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            },
          })
        )

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
          client.initEraseUser({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
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
