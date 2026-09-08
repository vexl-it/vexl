import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  type SendMessageRequest,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  commonHeaders,
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
    Effect.gen(function* () {
      // Clear database before each to start fresh
      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM inbox`
      yield* sql`DELETE FROM message`

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

      // will send message user1 -> user2
      yield* setAuthHeaders(user2.authHeaders)
      yield* client.Inboxes.approveRequest({
        headers: commonHeaders,
        payload: yield* user2.inbox1.addChallenge({
          message: 'someMessage2' as MessageCypher,
          publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
          approve: true,
        }),
      })

      // Will send message user2 -> user1
      const messageToSend = (yield* user2.inbox1.addChallenge({
        message: 'cancelMessage' as MessageCypher,
        messageType: 'MESSAGE' as const,
        receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
      })) satisfies SendMessageRequest

      yield* client.Messages.sendMessage({
        headers: commonHeaders,
        payload: messageToSend,
      })

      yield* sql`DELETE FROM message`
    })
  )
})

describe('Leave chat', () => {
  it('leaves chat and sends a message to the other party', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user2.authHeaders)
        yield* client.Inboxes.leaveChat({
          headers: commonHeaders,
          payload: yield* user2.inbox1.addChallenge({
            message: 'leaveMessage' as MessageCypher,
            receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
          }),
        })

        yield* setAuthHeaders(user1.authHeaders)
        const messagesForUser1 = yield* client.Messages.retrieveMessages({
          payload: yield* user1.addChallengeForMainInbox({}),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
        })

        expect(messagesForUser1.messages[0].message).toEqual('leaveMessage')
      })
    )
  })

  describe('it fails when', () => {
    it('Reciever inbox does not exist', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user2.authHeaders)
          const failedResponse = yield* pipe(
            client.Inboxes.leaveChat({
              headers: commonHeaders,
              payload: yield* user2.inbox1.addChallenge({
                message: 'leaveMessage' as MessageCypher,
                receiverPublicKey: generatePrivateKey().publicKeyPemBase64,
              }),
            }),
            Effect.result
          )

          expectErrorResponse(ReceiverInboxDoesNotExistError)(failedResponse)
        })
      )
    })

    it('Sender inbox does not exist', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user2.authHeaders)
          const failedResponse = yield* pipe(
            client.Inboxes.leaveChat({
              headers: commonHeaders,
              payload: yield* addChallengeForKey(
                generatePrivateKey(),
                user2.authHeaders
              )({
                message: 'leaveMessage' as MessageCypher,
                receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
              }),
            }),
            Effect.result
          )

          expectErrorResponse(SenderInboxDoesNotExistError)(failedResponse)
        })
      )
    })

    it('allows leaving without prior approval', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user2.authHeaders)
          const failedResponse = yield* pipe(
            client.Inboxes.leaveChat({
              headers: commonHeaders,
              payload: yield* user2.inbox1.addChallenge({
                message: 'leaveMessage' as MessageCypher,
                receiverPublicKey: user1.inbox1.keyPair.publicKeyPemBase64,
              }),
            }),
            Effect.result
          )

          expect(failedResponse._tag).toBe('Success')
        })
      )
    })
  })
})
