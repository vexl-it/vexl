import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe} from 'effect'
import {SqlClient, type SqlError} from 'effect/unstable/sql'
import {hashPublicKey} from '../../db/domain'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  commonHeaders,
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser
let user3: MockedUser

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      // Clear database before each to start fresh
      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM inbox`
      yield* sql`DELETE FROM message`

      user1 = yield* createMockedUser('+420733333330')
      user2 = yield* createMockedUser('+420733333331')
      user3 = yield* createMockedUser('+420733333332')
      const client = yield* NodeTestingApp

      // user1 -> user2.inbox1
      yield* setAuthHeaders(user1.authHeaders)

      const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
        user1.authHeaders
      )

      yield* client.Inboxes.requestApproval({
        payload: {
          message: 'cancelMessage' as MessageCypher,
          publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
        },
        headers: commonAndSecurityHeaders,
      })

      yield* setAuthHeaders(user2.authHeaders)
      yield* client.Inboxes.approveRequest({
        headers: commonHeaders,
        payload: yield* user2.inbox1.addChallenge({
          message: 'someMessage2' as MessageCypher,
          publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
          approve: true,
        }),
      })

      // user3 -> user2.inbox2
      yield* setAuthHeaders(user3.authHeaders)

      const commonAndSecurityHeaders3 = makeTestCommonAndSecurityHeaders(
        user3.authHeaders
      )

      yield* client.Inboxes.requestApproval({
        payload: {
          message: 'cancelMessage' as MessageCypher,
          publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
        },
        headers: commonAndSecurityHeaders3,
      })

      yield* setAuthHeaders(user2.authHeaders)
      yield* client.Inboxes.approveRequest({
        headers: commonHeaders,
        payload: yield* user2.inbox2.addChallenge({
          message: 'someMessage2' as MessageCypher,
          publicKeyToConfirm: user3.mainKeyPair.publicKeyPemBase64,
          approve: true,
        }),
      })
    })
  )
})

const expectInboxDeletedFully = (
  id: string
): Effect.Effect<void, SqlError.SqlError, SqlClient.SqlClient> =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    const deletedInbox = yield* sql`
      SELECT
        *
      FROM
        inbox
      WHERE
        id = ${id}
    `
    expect(deletedInbox).toHaveLength(0)

    const messagesForInbox = yield* sql`
      SELECT
        *
      FROM
        message
      WHERE
        inbox_id = ${id}
    `
    const allMessages = yield* sql`
      SELECT
        *
      FROM
        message
    `
    expect(messagesForInbox).toHaveLength(0)
    expect(allMessages).not.toHaveLength(0)
  })

describe('Delete inboxes', () => {
  it('deletes existing inbox and removes all messages and connections receiving by thtat inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        const sql = yield* SqlClient.SqlClient

        const [{id: id1}, {id: id2}] = yield* sql`
          SELECT
            id
          FROM
            inbox
          WHERE
            ${sql.in('public_key', [
            yield* hashPublicKey(user2.inbox1.keyPair.publicKeyPemBase64),
            yield* hashPublicKey(user2.inbox2.keyPair.publicKeyPemBase64),
          ])}
        `

        yield* setAuthHeaders(user2.authHeaders)
        yield* client.Inboxes.deleteInboxes({
          payload: {
            dataForRemoval: [
              yield* user2.inbox1.addChallenge({}),
              yield* user2.inbox2.addChallenge({}),
            ],
          },
        })
        yield* expectInboxDeletedFully(String(id1))
        yield* expectInboxDeletedFully(String(id2))
      })
    )
  })

  it('Throws an error when inbox does not exist and does not delete other inboxes in the request', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        const sql = yield* SqlClient.SqlClient

        yield* setAuthHeaders(user2.authHeaders)
        const error = yield* pipe(
          client.Inboxes.deleteInboxes({
            payload: {
              dataForRemoval: [
                yield* user2.inbox1.addChallenge({}),
                yield* user2.inbox2.addChallenge({}),
                yield* addChallengeForKey(
                  generatePrivateKey(),
                  user2.authHeaders
                )({}),
              ],
            },
          }),
          Effect.result
        )

        expectErrorResponse(InboxDoesNotExistError)(error)

        const [{id: id1}, {id: id2}] = yield* sql`
          SELECT
            id
          FROM
            inbox
          WHERE
            ${sql.in('public_key', [
            yield* hashPublicKey(user2.inbox1.keyPair.publicKeyPemBase64),
            yield* hashPublicKey(user2.inbox2.keyPair.publicKeyPemBase64),
          ])}
        `

        expect(id1).not.toBeUndefined()
        expect(id2).not.toBeUndefined()
      })
    )
  })
})
