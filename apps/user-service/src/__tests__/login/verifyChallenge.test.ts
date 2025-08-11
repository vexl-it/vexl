import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {ecdsaSign} from '@vexl-next/cryptography/src/operations/ecdsa'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {InvalidSignatureError} from '@vexl-next/rest-api/src/services/user/contracts'
import {mockedReportNewUserCreated} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {Effect, Either, pipe, Schema} from 'effect'
import {LoggedInUsersDbService} from '../../db/loggedInUsersDb'
import {SmsVerificationSid} from '../../utils/SmsVerificationSid.brand'
import {
  checkVerificationMock,
  createVerificationMock,
} from '../utils/mockedPreludeClient'
import {NodeTestingApp} from '../utils/NodeTestingApp'
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
  mockedReportNewUserCreated.mockClear()
})

describe('verify challenge', () => {
  it('Should throw an error when signature is not valid', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        createVerificationMock.mockReturnValueOnce(
          Effect.succeed(Schema.decodeSync(SmsVerificationSid)('123456'))
        )
        const client = yield* _(NodeTestingApp)
        const initResponse = yield* _(
          client.initVerification({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            body: {
              phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            },
          })
        )

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

        const signedChallenge = pipe(
          ecdsaSign({
            challenge: checkResponse.challenge + 'aha',
            privateKey: keypair.privateKeyPemBase64,
          }),
          Schema.decodeSync(EcdsaSignature)
        )

        const verifyChallenge = yield* _(
          client.verifyChallenge({
            body: {
              userPublicKey: keypair.publicKeyPemBase64,
              signature: signedChallenge,
            },
          }),
          Effect.either
        )

        expect(verifyChallenge._tag).toEqual('Left')
        if (Either.isLeft(verifyChallenge)) {
          const parsedError = Schema.decodeUnknownEither(InvalidSignatureError)(
            verifyChallenge.left.error
          )
          expect(parsedError._tag).toEqual('Right')
        }

        const usersDb = yield* _(LoggedInUsersDbService)

        expect(usersDb.insertUser).not.toBeCalled()
        expect(mockedReportNewUserCreated).not.toBeCalled()
      })
    )
  })
})
