import {
  generatePrivateKey,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {InvalidChallengeError} from '@vexl-next/rest-api/src/challenges/contracts'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {hashPublicKey} from '../../db/domain'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const user1Credentials = generatePrivateKey()
const user1Number = Schema.decodeSync(E164PhoneNumber)('+420733333330')
let user1authHeaders: {
  'public-key': PublicKeyPemBase64
  signature: EcdsaSignature
  hash: HashedPhoneNumber
}
let addChallengeForUser1: ReturnType<typeof addChallengeForKey>

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      user1authHeaders = yield* createDummyAuthHeadersForUser({
        phoneNumber: user1Number,
        publicKey: user1Credentials.publicKeyPemBase64,
      })

      addChallengeForUser1 = addChallengeForKey(
        user1Credentials,
        user1authHeaders
      )
    })
  )
})

describe('Create inbox', () => {
  afterEach(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const sql = yield* SqlClient.SqlClient
        yield* sql`DELETE FROM inbox`
      })
    )
  })

  it('Does not create inbox with invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user1authHeaders)
        const createResponse = yield* pipe(
          client.Inboxes.createInbox({
            payload: yield* addChallengeForUser1({}, true),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          }),
          Effect.result
        )
        expectErrorResponse(InvalidChallengeError)(createResponse)
      })
    )
  })

  it('Creates inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user1authHeaders)
        const createResponse = yield* pipe(
          client.Inboxes.createInbox({
            payload: yield* addChallengeForUser1({}),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          }),
          Effect.result
        )

        expect(createResponse._tag).toBe('Success')

        const hashedPublicKey = yield* hashPublicKey(
          user1Credentials.publicKeyPemBase64
        )

        const sql = yield* SqlClient.SqlClient
        const data = yield* sql`
          SELECT
            *
          FROM
            inbox
          WHERE
            public_key = ${hashedPublicKey}
            AND platform = 'ANDROID'
            AND client_version = 1
        `

        expect(data).toHaveLength(1)
      })
    )
  })

  it('Does not fail when inbox already exists & updates metadata', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user1authHeaders)
        const createResponse = yield* pipe(
          client.Inboxes.createInbox({
            payload: yield* addChallengeForUser1({}),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          }),
          Effect.result
        )
        expect(createResponse._tag).toBe('Success')

        const createResponse2 = yield* pipe(
          client.Inboxes.createInbox({
            payload: yield* addChallengeForUser1({}),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          }),
          Effect.result
        )
        expect(createResponse2._tag).toBe('Success')

        const inboxHash = yield* hashPublicKey(
          user1Credentials.publicKeyPemBase64
        )
        const sql = yield* SqlClient.SqlClient
        const data = yield* sql`
          SELECT
            *
          FROM
            inbox
          WHERE
            public_key = ${inboxHash}
        `
        expect(data[0].platform).toBe('IOS')
        expect(data[0].clientVersion).toBe(2)
      })
    )
  })
})
