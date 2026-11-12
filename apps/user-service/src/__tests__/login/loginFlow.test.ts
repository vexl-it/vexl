import {
  generatePrivateKey,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {ecdsaSign} from '@vexl-next/cryptography/src/operations/ecdsa'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {type VerifyChallengeResponse} from '@vexl-next/rest-api/src/services/user/contracts'
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
  type MockedContexts,
} from '../utils/runPromiseInMockedEnvironment'

beforeAll(startRuntime)
afterAll(disposeRuntime)

beforeEach(() => {
  createVerificationMock.mockClear()
  checkVerificationMock.mockClear()
  mockedReportNewUserCreated.mockClear()
})

const verifyNumber = (
  phoneNumber: string,
  keypair: PrivateKeyHolder
): Effect.Effect<VerifyChallengeResponse, unknown, MockedContexts> =>
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
          phoneNumber: Schema.decodeSync(E164PhoneNumber)(phoneNumber),
        },
      })
    )

    expect(initResponse.verificationId).toBeDefined()
    expect(initResponse.expirationAt).toBeDefined()

    checkVerificationMock.mockReturnValueOnce(Effect.succeed('valid'))
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

    const credentials = yield* _(
      client.Login.verifyChallenge({
        payload: {
          userPublicKey: keypair.publicKeyPemBase64,
          signature: pipe(
            ecdsaSign({
              challenge: checkResponse.challenge,
              privateKey: keypair.privateKeyPemBase64,
            }),
            Schema.decodeSync(EcdsaSignature)
          ),
        },
      })
    )

    expect(
      (yield* _(
        verifyUserSecurity({
          hash: credentials.hash,
          signature: credentials.signature,
          publicKey: keypair.publicKeyPemBase64,
        }),
        Effect.either
      ))._tag
    ).toBe('Right')

    return credentials
  })

describe('loginFlow', () => {
  it('should generate proper user credentials', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const keypair = generatePrivateKey()
        yield* _(verifyNumber('+420733333333', keypair))

        const usersDb = yield* _(LoggedInUsersDbService)
        expect(usersDb.insertUserIfNew).toHaveBeenCalledWith({
          publicKey: keypair.publicKeyPemBase64,
          countryPrefix: 420,
        })
        expect(mockedReportNewUserCreated).toHaveBeenCalledTimes(1)
      })
    )
  })

  it('verifies another number with the public key of an existing user', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const keypair = generatePrivateKey()
        const first = yield* _(verifyNumber('+420733333333', keypair))
        const second = yield* _(verifyNumber('+421903123456', keypair))

        expect(second.hash).not.toEqual(first.hash)

        const usersDb = yield* _(LoggedInUsersDbService)
        expect(usersDb.insertUserIfNew).toHaveBeenLastCalledWith({
          publicKey: keypair.publicKeyPemBase64,
          countryPrefix: 421,
        })
        expect(mockedReportNewUserCreated).toHaveBeenCalledTimes(1)
      })
    )
  })
})
