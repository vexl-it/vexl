import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {MAX_PUBLIC_KEYS_IN_CHECK_INBOXES_EXIST_REQUEST} from '@vexl-next/rest-api/src/services/chat/contracts'
import {Array, Effect, Schema} from 'effect'
import {hashPublicKey} from '../../db/domain'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

const existingInbox1 = generatePrivateKey()
const existingInbox2 = generatePrivateKey()
const missingInbox = generatePrivateKey()

const headers = Schema.decodeSync(CommonHeaders)({
  'user-agent': 'Vexl/1 (1.0.0) ANDROID',
})

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      const sql = yield* _(SqlClient.SqlClient)
      yield* _(
        Effect.forEach([existingInbox1, existingInbox2], (key) =>
          Effect.flatMap(
            hashPublicKey(key.publicKeyPemBase64),
            (publicKey) => sql`
              INSERT INTO
                inbox ${sql.insert({publicKey, platform: 'ANDROID'})}
            `
          )
        )
      )
    })
  )
})

describe('Check inboxes exist', () => {
  afterAll(async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`DELETE FROM inbox`)
      })
    )
  })

  it('Returns only public keys of existing inboxes', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.Inboxes.checkInboxesExist({
            payload: {
              publicKeys: [
                existingInbox1.publicKeyPemBase64,
                missingInbox.publicKeyPemBase64,
                existingInbox2.publicKeyPemBase64,
                existingInbox1.publicKeyPemBase64,
              ],
            },
            headers,
          })
        )

        expect(response.existingPublicKeys).toEqual([
          existingInbox1.publicKeyPemBase64,
          existingInbox2.publicKeyPemBase64,
        ])
      })
    )
  })

  it('Returns empty list for empty request', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.Inboxes.checkInboxesExist({
            payload: {publicKeys: []},
            headers,
          })
        )

        expect(response.existingPublicKeys).toEqual([])
      })
    )
  })

  it('Rejects requests with too many public keys', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const response = yield* _(
          client.Inboxes.checkInboxesExist({
            payload: {
              publicKeys: Array.replicate(
                missingInbox.publicKeyPemBase64,
                MAX_PUBLIC_KEYS_IN_CHECK_INBOXES_EXIST_REQUEST + 1
              ),
            },
            headers,
          }),
          Effect.either
        )

        expect(response._tag).toBe('Left')
      })
    )
  })
})
