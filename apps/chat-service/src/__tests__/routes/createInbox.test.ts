import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {SqlClient} from '@effect/sql'
import {
  generatePrivateKey,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder'
import {E164PhoneNumberE} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type EcdsaSignature} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {InvalidChallengeError} from '@vexl-next/rest-api/src/services/chat/contracts'
import {createDummyAuthHeadersForUser} from '@vexl-next/server-utils/src/tests/createDummyAuthHeaders'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {Effect} from 'effect'
import {hashPublicKey} from '../../db/domain'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const user1Credentials = generatePrivateKey()
const user1Number = Schema.decodeSync(E164PhoneNumberE)('+420733333330')
let user1authHeaders: {
  'public-key': PublicKeyPemBase64
  signature: EcdsaSignature
  hash: HashedPhoneNumber
}
let addChallengeForUser1: ReturnType<typeof addChallengeForKey>

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      user1authHeaders = yield* _(
        createDummyAuthHeadersForUser({
          phoneNumber: user1Number,
          publicKey: user1Credentials.publicKeyPemBase64,
        })
      )

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
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM inbox`)
      })
    )
  })

  it('Does not create inbox with invalid challenge', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const createResponse = yield* _(
          client.createInbox(
            {
              body: yield* _(addChallengeForUser1({}, true)),
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              }),
            },
            HttpClientRequest.setHeaders(user1authHeaders)
          ),
          Effect.either
        )
        expectErrorResponse(InvalidChallengeError)(createResponse)
      })
    )
  })

  it('Creates inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const createResponse = yield* _(
          client.createInbox(
            {
              body: yield* _(addChallengeForUser1({})),
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              }),
            },
            HttpClientRequest.setHeaders(user1authHeaders)
          ),
          Effect.either
        )

        expect(createResponse._tag).toBe('Right')

        const hashedPublicKey = yield* _(
          hashPublicKey(user1Credentials.publicKeyPemBase64)
        )

        const sql = yield* _(SqlClient.SqlClient)
        const data = yield* _(sql`
          SELECT
            *
          FROM
            inbox
          WHERE
            public_key = ${hashedPublicKey}
            AND platform = 'ANDROID'
            AND client_version = 1
        `)

        expect(data).toHaveLength(1)
      })
    )
  })

  it('Does not fail when inbox already exists & updates metadata', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const createResponse = yield* _(
          client.createInbox(
            {
              body: yield* _(addChallengeForUser1({})),
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/1 (1.0.0) ANDROID',
              }),
            },
            HttpClientRequest.setHeaders(user1authHeaders)
          ),
          Effect.either
        )
        expect(createResponse._tag).toBe('Right')

        const createResponse2 = yield* _(
          client.createInbox(
            {
              body: yield* _(addChallengeForUser1({})),
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/2 (1.0.0) IOS',
              }),
            },
            HttpClientRequest.setHeaders(user1authHeaders)
          ),
          Effect.either
        )
        expect(createResponse2._tag).toBe('Right')

        const inboxHash = yield* _(
          hashPublicKey(user1Credentials.publicKeyPemBase64)
        )
        const sql = yield* _(SqlClient.SqlClient)
        const data = yield* _(sql`
          SELECT
            *
          FROM
            inbox
          WHERE
            public_key = ${inboxHash}
        `)
        expect(data[0].platform).toBe('IOS')
        expect(data[0].clientVersion).toBe(2)
      })
    )
  })
})
