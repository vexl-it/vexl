import {SqlClient, type SqlError} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {hashPublicKey} from '../../db/domain'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
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
    Effect.gen(function* (_) {
      // Clear database before each to start fresh
      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM inbox`)
      yield* _(sql`DELETE FROM message`)
      yield* _(sql`DELETE FROM white_list`)

      user1 = yield* _(createMockedUser('+420733333330'))
      user2 = yield* _(createMockedUser('+420733333331'))
      user3 = yield* _(createMockedUser('+420733333332'))
      const client = yield* _(NodeTestingApp)

      // user1 -> user2.inbox1
      yield* _(setAuthHeaders(user1.authHeaders))

      const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
        user1.authHeaders
      )

      yield* _(
        client.Inboxes.requestApproval({
          payload: {
            message: 'someMessage',
            publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          },
          headers: commonAndSecurityHeaders,
        })
      )

      yield* _(setAuthHeaders(user2.authHeaders))
      yield* _(
        client.Inboxes.approveRequest({
          payload: yield* _(
            user2.inbox1.addChallenge({
              message: 'someMessage2',
              publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
              approve: true,
            })
          ),
        })
      )

      // user3 -> user2.inbox2
      yield* _(setAuthHeaders(user3.authHeaders))

      const commonAndSecurityHeaders3 = makeTestCommonAndSecurityHeaders(
        user3.authHeaders
      )

      yield* _(
        client.Inboxes.requestApproval({
          payload: {
            message: 'someMessage',
            publicKey: user2.inbox2.keyPair.publicKeyPemBase64,
          },
          headers: commonAndSecurityHeaders3,
        })
      )

      yield* _(setAuthHeaders(user2.authHeaders))
      yield* _(
        client.Inboxes.approveRequest({
          payload: yield* _(
            user2.inbox2.addChallenge({
              message: 'someMessage2',
              publicKeyToConfirm: user3.mainKeyPair.publicKeyPemBase64,
              approve: true,
            })
          ),
        })
      )
    })
  )
})

const expectInboxDeletedFully = (
  id: string
): Effect.Effect<void, SqlError.SqlError, SqlClient.SqlClient> =>
  Effect.gen(function* (_) {
    const sql = yield* _(SqlClient.SqlClient)
    const deletedInbox = yield* _(sql`
      SELECT
        *
      FROM
        inbox
      WHERE
        id = ${id}
    `)
    expect(deletedInbox).toHaveLength(0)

    const messagesForInbox = yield* _(sql`
      SELECT
        *
      FROM
        message
      WHERE
        inbox_id = ${id}
    `)
    const allMessages = yield* _(sql`
      SELECT
        *
      FROM
        message
    `)
    expect(messagesForInbox).toHaveLength(0)
    expect(allMessages).not.toHaveLength(0)
  })

describe('Delete inboxes', () => {
  it('deletes existing inbox and removes all messages and connections receiving by thtat inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        const [{id: id1}, {id: id2}] = yield* _(sql`
          SELECT
            id
          FROM
            inbox
          WHERE
            ${sql.in('public_key', [
            yield* _(hashPublicKey(user2.inbox1.keyPair.publicKeyPemBase64)),
            yield* _(hashPublicKey(user2.inbox2.keyPair.publicKeyPemBase64)),
          ])}
        `)

        yield* _(setAuthHeaders(user2.authHeaders))
        yield* _(
          client.Inboxes.deleteInboxes({
            payload: {
              dataForRemoval: [
                yield* _(user2.inbox1.addChallenge({})),
                yield* _(user2.inbox2.addChallenge({})),
              ],
            },
          })
        )
        yield* _(expectInboxDeletedFully(String(id1)))
        yield* _(expectInboxDeletedFully(String(id2)))
      })
    )
  })

  it('Throws an error when inbox does not exist and does not delete other inboxes in the request', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        yield* _(setAuthHeaders(user2.authHeaders))
        const error = yield* _(
          client.Inboxes.deleteInboxes({
            payload: {
              dataForRemoval: [
                yield* _(user2.inbox1.addChallenge({})),
                yield* _(user2.inbox2.addChallenge({})),
                yield* _(
                  addChallengeForKey(
                    generatePrivateKey(),
                    user2.authHeaders
                  )({})
                ),
              ],
            },
          }),
          Effect.either
        )

        expectErrorResponse(InboxDoesNotExistError)(error)

        const [{id: id1}, {id: id2}] = yield* _(sql`
          SELECT
            id
          FROM
            inbox
          WHERE
            ${sql.in('public_key', [
            yield* _(hashPublicKey(user2.inbox1.keyPair.publicKeyPemBase64)),
            yield* _(hashPublicKey(user2.inbox2.keyPair.publicKeyPemBase64)),
          ])}
        `)

        expect(id1).not.toBeUndefined()
        expect(id2).not.toBeUndefined()
      })
    )
  })
})
