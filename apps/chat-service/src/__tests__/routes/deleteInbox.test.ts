import {SqlClient} from '@effect/sql'
import {type SendMessageRequest} from '@vexl-next/rest-api/src/services/chat/contracts'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect} from 'effect'
import {hashPublicKey} from '../../db/domain'
import {
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser

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
      const client = yield* _(NodeTestingApp)

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

      // will send message user1 -> user2
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

      // Will send message user2 -> user1
      const messageToSend = (yield* _(
        user2.inbox1.addChallenge({
          message: 'someMessage',
          messageType: 'MESSAGE' as const,
          receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
        })
      )) satisfies SendMessageRequest

      yield* _(
        client.Messages.sendMessage({
          payload: messageToSend,
        })
      )
    })
  )
})

describe('deleteInbox', () => {
  it('deletes existing inbox and removes all messages and connections receiving by thtat inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        const sql = yield* _(SqlClient.SqlClient)

        const [{id}] = yield* _(sql`
          SELECT
            id
          FROM
            inbox
          WHERE
            public_key = ${yield* _(
            hashPublicKey(user2.inbox1.keyPair.publicKeyPemBase64)
          )}
        `)

        yield* _(setAuthHeaders(user2.authHeaders))
        yield* _(
          client.Inboxes.deleteInbox({
            payload: yield* _(user2.inbox1.addChallenge({})),
          })
        )

        expect(id).not.toBeUndefined()

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

        const whitelists = yield* _(sql`
          SELECT
            *
          FROM
            white_list
        `)
        expect(whitelists).toHaveLength(0)
      })
    )
  })

  it('Throws an error when inbox is already removed', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(user2.authHeaders))
        yield* _(
          client.Inboxes.deleteInbox({
            payload: yield* _(user2.inbox1.addChallenge({})),
          })
        )

        const failResponse = yield* _(
          client.Inboxes.deleteInbox({
            payload: yield* _(user2.inbox1.addChallenge({})),
          }),
          Effect.either
        )

        expectErrorResponse(InboxDoesNotExistError)(failResponse)
      })
    )
  })
})
