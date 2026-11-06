import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {ecdsaSign} from '@vexl-next/cryptography/src/operations/ecdsa'
import {UnauthorizedError} from '@vexl-next/domain/src/general/commonErrors'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/EcdsaSignature.brand'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  type GetBackupKeyPairResponse,
  type InitPhoneVerificationResponse,
  UnableToVerifySmsCodeError,
  VerificationNotFoundError,
} from '@vexl-next/rest-api/src/services/user/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect, pipe, Schema} from 'effect'
import {makeTestCommonAndSecurityHeaders} from '../utils/createTestCommonAndSecurityHeaders'
import {generateAndSignChallenge} from '../utils/loginChalenge'
import {checkVerificationMock} from '../utils/mockedPreludeClient'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {
  disposeRuntime,
  type MockedContexts,
  runPromiseInMockedEnvironment,
  startRuntime,
} from '../utils/runPromiseInMockedEnvironment'

beforeAll(startRuntime)
afterAll(disposeRuntime)

beforeEach(() => {
  checkVerificationMock.mockClear()
})

const phoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333333')
const otherPhoneNumber = Schema.decodeSync(E164PhoneNumber)('+420733333334')

const initVerification = (
  forPhoneNumber: E164PhoneNumber
): Effect.Effect<InitPhoneVerificationResponse, unknown, MockedContexts> =>
  Effect.gen(function* (_) {
    const client = yield* _(NodeTestingApp)
    return yield* _(
      client.Login.initVerification({
        headers: Schema.decodeSync(CommonHeaders)({
          'user-agent': 'Vexl/2 (1.0.0) IOS',
        }),
        payload: {
          challenge: yield* _(generateAndSignChallenge),
          phoneNumber: forPhoneNumber,
        },
      })
    )
  })

const login = (
  forPhoneNumber: E164PhoneNumber
): Effect.Effect<
  ReturnType<typeof makeTestCommonAndSecurityHeaders>,
  unknown,
  MockedContexts
> =>
  Effect.gen(function* (_) {
    const client = yield* _(NodeTestingApp)
    const {verificationId} = yield* _(initVerification(forPhoneNumber))
    const keypair = generatePrivateKey()

    const {challenge} = yield* _(
      client.Login.verifyCode({
        payload: {
          userPublicKey: keypair.publicKeyPemBase64,
          id: verificationId,
          code: '123456',
        },
      })
    )
    const {hash, signature} = yield* _(
      client.Login.verifyChallenge({
        payload: {
          userPublicKey: keypair.publicKeyPemBase64,
          signature: pipe(
            ecdsaSign({challenge, privateKey: keypair.privateKeyPemBase64}),
            Schema.decodeSync(EcdsaSignature)
          ),
        },
      })
    )

    return makeTestCommonAndSecurityHeaders({
      'public-key': keypair.publicKeyPemBase64,
      hash,
      signature,
    })
  })

const getBackupKeyPair = (
  forPhoneNumber: E164PhoneNumber
): Effect.Effect<GetBackupKeyPairResponse, unknown, MockedContexts> =>
  Effect.gen(function* (_) {
    const client = yield* _(NodeTestingApp)
    const {verificationId} = yield* _(initVerification(forPhoneNumber))
    return yield* _(
      client.Backup.getBackupKeyPair({
        payload: {id: verificationId, code: '123456'},
      })
    )
  })

describe('backup keys', () => {
  it('returns the public key of the key pair released after phone verification', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const headers = yield* _(login(phoneNumber))

        const {publicKey} = yield* _(
          client.Backup.getBackupPublicKey({headers})
        )
        const {keyPair} = yield* _(getBackupKeyPair(phoneNumber))

        expect(keyPair.publicKey).toEqual(publicKey)
        expect(keyPair.privateKey).toBeDefined()
      })
    )
  })

  it('derives different keys for different phone numbers', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const {keyPair} = yield* _(getBackupKeyPair(phoneNumber))
        const {keyPair: otherKeyPair} = yield* _(
          getBackupKeyPair(otherPhoneNumber)
        )

        expect(otherKeyPair.publicKey).not.toEqual(keyPair.publicKey)
      })
    )
  })

  it('rejects public key requests without a valid session', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const publicKey = generatePrivateKey().publicKeyPemBase64
        const authHeaders = yield* _(
          createDummyAuthHeadersForUser({phoneNumber, publicKey})
        )
        const {signature: otherNumberSignature} = yield* _(
          createDummyAuthHeadersForUser({
            phoneNumber: otherPhoneNumber,
            publicKey,
          })
        )

        expectErrorResponse(UnauthorizedError)(
          yield* _(
            client.Backup.getBackupPublicKey({
              headers: makeTestCommonAndSecurityHeaders({
                ...authHeaders,
                signature: otherNumberSignature,
              }),
            }),
            Effect.either
          )
        )
      })
    )
  })

  it('rejects a wrong code', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const {verificationId} = yield* _(initVerification(phoneNumber))

        checkVerificationMock.mockReturnValueOnce(
          Effect.fail(
            new UnableToVerifySmsCodeError({
              reason: 'BadCode',
              status: 400,
              code: '100104',
            })
          )
        )

        expectErrorResponse(UnableToVerifySmsCodeError)(
          yield* _(
            client.Backup.getBackupKeyPair({
              payload: {id: verificationId, code: '654321'},
            }),
            Effect.either
          )
        )
      })
    )
  })

  it('consumes the verification', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const {verificationId} = yield* _(initVerification(phoneNumber))
        const payload = {id: verificationId, code: '123456'}

        yield* _(client.Backup.getBackupKeyPair({payload}))

        expectErrorResponse(VerificationNotFoundError)(
          yield* _(client.Backup.getBackupKeyPair({payload}), Effect.either)
        )
        expectErrorResponse(VerificationNotFoundError)(
          yield* _(
            client.Login.verifyCode({
              payload: {
                ...payload,
                userPublicKey: generatePrivateKey().publicKeyPemBase64,
              },
            }),
            Effect.either
          )
        )
      })
    )
  })
})
