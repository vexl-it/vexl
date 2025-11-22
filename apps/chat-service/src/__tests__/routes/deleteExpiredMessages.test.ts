import {SqlClient} from '@effect/sql'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {type SendMessageRequest} from '@vexl-next/rest-api/src/services/chat/contracts'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {clearExpiredMessages} from '../../internalServer/routes/clearExpiredMessages'
import {NodeTestingApp} from '../utils/NodeTestingApp'
import {
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

let user1: MockedUser
let user2: MockedUser

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
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

      const sql = yield* _(SqlClient.SqlClient)
      yield* _(sql`DELETE FROM message`)
    })
  )
})

describe('clear expired messages', () => {
  it('Deletes only expired messages', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user1.addChallengeForMainInbox({
            message: 'someMessageToBeDeleted',
            messageType: 'MESSAGE' as const,
            receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        const messageToSend2 = (yield* _(
          user1.addChallengeForMainInbox({
            message: 'someMessageToNotBeDeleted',
            messageType: 'MESSAGE' as const,
            receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        yield* _(setAuthHeaders(user1.authHeaders))
        yield* _(
          client.Messages.sendMessage({
            payload: messageToSend,
          })
        )

        yield* _(
          client.Messages.sendMessage({
            payload: messageToSend2,
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE message
          SET
            expires_at = now()::date
          WHERE
            message = 'someMessageToBeDeleted'
        `)

        yield* _(clearExpiredMessages)

        yield* _(setAuthHeaders(user2.authHeaders))
        const messagesReceived = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user2.inbox1.addChallenge({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )

        expect(messagesReceived.messages.length).toBe(1)
        expect(messagesReceived.messages[0].message).toBe(
          'someMessageToNotBeDeleted'
        )

        const messagesReceived2 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user2.inbox2.addChallenge({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )

        expect(messagesReceived2.messages.length).toBe(0)
      })
    )
  })
})
