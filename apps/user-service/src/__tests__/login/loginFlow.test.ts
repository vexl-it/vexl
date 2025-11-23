import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {ecdsaSign} from '@vexl-next/cryptography/src/operations/ecdsa'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {verifyUserSecurity} from '@vexl-next/server-utils/src/serverSecurity'
import {mockedReportNewUserCreated} from '@vexl-next/server-utils/src/tests/mockedDashboardReportsService'
import {Effect, pipe, Schema} from 'effect'
import {LoggedInUsersDbService} from '../../db/loggedInUsersDb'
import {SmsVerificationSid} from '../../utils/SmsVerificationSid.brand'
import {generateAndSignChallenge} from '../utils/loginChalenge'
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

describe('loginFlow', () => {
  it('should generate proper user credentials', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        createVerificationMock.mockReturnValueOnce(
          Effect.succeed(Schema.decodeSync(SmsVerificationSid)('123456'))
        )
        const client = yield* _(NodeTestingApp)
        const initResponse = yield* _(
          client.Login.initVerification({
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
            payload: {
              challenge: yield* _(generateAndSignChallenge),
              phoneNumber: Schema.decodeSync(E164PhoneNumberE)('+420733333333'),
            },
          })
        )

        expect(initResponse.verificationId).toBeDefined()
        expect(initResponse.expirationAt).toBeDefined()

        checkVerificationMock.mockReturnValueOnce(Effect.succeed('valid'))
        const keypair = generatePrivateKey()
        const checkResponse = yield* _(
          client.Login.verifyCode({
            payload: {
              userPublicKey: keypair.publicKeyPemBase64,
              id: initResponse.verificationId,
              code: '123456',
            },
          })
        )

        expect(checkResponse.challenge).toBeDefined()

        const signedChallenge = pipe(
          ecdsaSign({
            challenge: checkResponse.challenge,
            privateKey: keypair.privateKeyPemBase64,
          }),
          Schema.decodeSync(EcdsaSignature)
        )

        const verifyChallenge = yield* _(
          client.Login.verifyChallenge({
            payload: {
              userPublicKey: keypair.publicKeyPemBase64,
              signature: signedChallenge,
            },
          })
        )

        expect(verifyChallenge.hash).toBeDefined()
        expect(verifyChallenge.signature).toBeDefined()

        const usersDb = yield* _(LoggedInUsersDbService)
        expect(usersDb.insertUser).toHaveBeenCalledWith({
          publicKey: keypair.publicKeyPemBase64,
          countryPrefix: 420,
        })

        expect(mockedReportNewUserCreated).toHaveBeenCalledTimes(1)

        expect(
          (yield* _(
            verifyUserSecurity({
              hash: verifyChallenge.hash,
              signature: verifyChallenge.signature,
              'public-key': keypair.publicKeyPemBase64,
            }),
            Effect.either
          ))._tag
        ).toBe('Right')
      })
    )
  })
})
