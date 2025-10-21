import {Effect, Schema} from 'effect'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {type SendMessageRequest} from '@vexl-next/rest-api/src/services/chat/contracts'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {
  clearTestAuthHeaders,
  setAuthHeaders,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'

let user1: MockedUser
let user2: MockedUser

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* (_) {
      user1 = yield* _(createMockedUser('+420733333330'))
      user2 = yield* _(createMockedUser('+420733333331'))
      const client = yield* _(NodeTestingApp)

      yield* _(setAuthHeaders(user1.authHeaders))
      yield* _(
        client.Inboxes.requestApproval({
          payload: {
            message: 'someMessage',
            publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          },
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

      yield* _(clearTestAuthHeaders)
    })
  )
})

describe('Delete pulled messages', () => {
  it('Delete pulled messages so the other user can not retreive them anymore', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(user1.authHeaders))
        const messagesForUser1Before = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )
        expect(messagesForUser1Before.messages).not.toHaveLength(0)

        const messageToSend = (yield* _(
          user2.inbox1.addChallenge({
            message: 'Message sent after pull',
            messageType: 'MESSAGE' as const,
            receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        yield* _(setAuthHeaders(user2.authHeaders))
        yield* _(
          client.Messages.sendMessage({
            payload: messageToSend,
          })
        )

        yield* _(setAuthHeaders(user1.authHeaders))
        yield* _(
          client.Inboxes.deletePulledMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
          })
        )

        const messagesForUser1 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )
        expect(messagesForUser1.messages).toHaveLength(1)
        expect(messagesForUser1.messages[0].message).toBe(
          'Message sent after pull'
        )

        yield* _(setAuthHeaders(user2.authHeaders))
        const messagesForUser2 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user2.inbox1.addChallenge({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )
        // only request message
        expect(messagesForUser2.messages).toHaveLength(1)
      })
    )
  })

  it('Retruns an error when inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(user1.authHeaders))

        const errorResponse = yield* _(
          client.Inboxes.deletePulledMessages({
            payload: yield* _(
              addChallengeForKey(generatePrivateKey(), user1.authHeaders)({})
            ),
          }),
          Effect.either
        )

        expectErrorResponse(InboxDoesNotExistError)(errorResponse)
      })
    )
  })
})
