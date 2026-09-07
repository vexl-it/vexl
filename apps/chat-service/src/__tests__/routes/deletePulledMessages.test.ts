import {Effect, pipe, Schema} from 'effect'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {type SendMessageRequest} from '@vexl-next/rest-api/src/services/chat/contracts'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {mockedReportMetric} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {
  clearTestAuthHeaders,
  setAuthHeaders,
} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  commonHeaders,
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
import {NodeTestingApp} from '../utils/NodeTestingApp'

let user1: MockedUser
let user2: MockedUser

beforeAll(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
      user1 = yield* createMockedUser('+420733333330')
      user2 = yield* createMockedUser('+420733333331')
      const client = yield* NodeTestingApp

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

      yield* clearTestAuthHeaders
    })
  )
})

describe('Delete pulled messages', () => {
  it('Delete pulled messages so the other user can not retreive them anymore', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user1.authHeaders)
        const messagesForUser1Before = yield* client.Messages.retrieveMessages({
          payload: yield* user1.addChallengeForMainInbox({}),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
        })
        expect(messagesForUser1Before.messages).not.toHaveLength(0)

        const messageToSend = (yield* user2.inbox1.addChallenge({
          message: 'Message sent after pull' as MessageCypher,
          messageType: 'MESSAGE' as const,
          receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
        })) satisfies SendMessageRequest

        yield* setAuthHeaders(user2.authHeaders)
        yield* client.Messages.sendMessage({
          headers: commonHeaders,
          payload: messageToSend,
        })

        mockedReportMetric.mockClear()
        yield* setAuthHeaders(user1.authHeaders)
        yield* client.Inboxes.deletePulledMessages({
          headers: commonHeaders,
          payload: yield* user1.addChallengeForMainInbox({}),
        })

        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'MESSAGE_FETCHED_AND_REMOVED',
            value: messagesForUser1Before.messages.length,
            attributes: expect.objectContaining({
              messageAgeSeconds: expect.any(Number),
            }),
          })
        )

        const messagesForUser1 = yield* client.Messages.retrieveMessages({
          payload: yield* user1.addChallengeForMainInbox({}),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
        })
        expect(messagesForUser1.messages).toHaveLength(1)
        expect(messagesForUser1.messages[0].message).toBe(
          'Message sent after pull'
        )

        yield* setAuthHeaders(user2.authHeaders)
        const messagesForUser2 = yield* client.Messages.retrieveMessages({
          payload: yield* user2.inbox1.addChallenge({}),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
        })
        // only request message
        expect(messagesForUser2.messages).toHaveLength(1)
      })
    )
  })

  it('Retruns an error when inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp
        yield* setAuthHeaders(user1.authHeaders)

        const errorResponse = yield* pipe(
          client.Inboxes.deletePulledMessages({
            headers: commonHeaders,
            payload: yield* addChallengeForKey(
              generatePrivateKey(),
              user1.authHeaders
            )({}),
          }),
          Effect.result
        )

        expectErrorResponse(InboxDoesNotExistError)(errorResponse)
      })
    )
  })
})
