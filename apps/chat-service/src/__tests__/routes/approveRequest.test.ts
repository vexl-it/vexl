import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
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

beforeEach(async () => {
  await runPromiseInMockedEnvironment(
    Effect.gen(function* () {
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
          message: 'someMessage' as MessageCypher,
          publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
        },
        headers: commonAndSecurityHeaders,
      })
    })
  )
})

// Expecting user1 mainKey to be approved by user2.inbox1

describe('Approve request', () => {
  it('Request can be approved when it is pending - the message is sent to requester after', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user2.authHeaders)
        yield* client.Inboxes.approveRequest({
          headers: commonHeaders,
          payload: yield* user2.inbox1.addChallenge({
            message: 'acceptMessage' as MessageCypher,
            publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
            approve: true,
          }),
        })

        yield* setAuthHeaders(user1.authHeaders)
        const messages = yield* client.Messages.retrieveMessages({
          payload: yield* user1.addChallengeForMainInbox({}),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
        })

        expect(messages.messages[0].message).toBe('acceptMessage')

        const sendingMessagesToEachOtherRequests = yield* pipe(
          Effect.all([
            Effect.gen(function* () {
              yield* setAuthHeaders(user2.authHeaders)
              return yield* client.Messages.sendMessage({
                headers: commonHeaders,
                payload: yield* user2.inbox1.addChallenge({
                  message: 'someOtherMessage' as MessageCypher,
                  receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                  messageType: 'MESSAGE' as const,
                }),
              })
            }),

            Effect.gen(function* () {
              yield* setAuthHeaders(user1.authHeaders)
              return yield* client.Messages.sendMessage({
                headers: commonHeaders,
                payload: yield* user1.addChallengeForMainInbox({
                  message: 'someOtherMessage2' as MessageCypher,
                  receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
                  messageType: 'MESSAGE' as const,
                }),
              })
            }),
          ]),
          Effect.result
        )
        expect(sendingMessagesToEachOtherRequests._tag).toBe('Success')
      })
    )
  })

  it('Request can be disaproved when it is pending - the message is sent to requester after', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        yield* setAuthHeaders(user2.authHeaders)
        yield* client.Inboxes.approveRequest({
          headers: commonHeaders,
          payload: yield* user2.inbox1.addChallenge({
            message: 'disapproveMessage' as MessageCypher,
            publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
            approve: false,
          }),
        })

        yield* setAuthHeaders(user1.authHeaders)
        const messages = yield* client.Messages.retrieveMessages({
          payload: yield* user1.addChallengeForMainInbox({}),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
        })

        expect(messages.messages[0].message).toBe('disapproveMessage')

        const sendingMessagesToEachOtherRequests = yield* Effect.all([
          Effect.gen(function* () {
            yield* setAuthHeaders(user2.authHeaders)
            return yield* pipe(
              client.Messages.sendMessage({
                headers: commonHeaders,
                payload: yield* user2.inbox1.addChallenge({
                  message: 'someOtherMessage' as MessageCypher,
                  receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                  messageType: 'MESSAGE' as const,
                }),
              }),
              Effect.result
            )
          }),

          Effect.gen(function* () {
            yield* setAuthHeaders(user1.authHeaders)
            return yield* pipe(
              client.Messages.sendMessage({
                headers: commonHeaders,
                payload: yield* user1.addChallengeForMainInbox({
                  message: 'someOtherMessage2' as MessageCypher,
                  receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
                  messageType: 'MESSAGE' as const,
                }),
              }),
              Effect.result
            )
          }),
        ])

        expect(
          sendingMessagesToEachOtherRequests.map((one) => one._tag).join(', ')
        ).toBe('Success, Success')
      })
    )
  })

  describe('Request can be approved without whitelist state', () => {
    it('after a cancellation', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user1.authHeaders)

          const commonAndSecurityHeaders = makeTestCommonAndSecurityHeaders(
            user1.authHeaders
          )

          yield* client.Inboxes.cancelRequestApproval({
            payload: {
              message: 'someMessage2' as MessageCypher,
              publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
            },
            headers: commonAndSecurityHeaders,
          })

          yield* setAuthHeaders(user2.authHeaders)
          const errorResponse = yield* pipe(
            client.Inboxes.approveRequest({
              headers: commonHeaders,
              payload: yield* user2.inbox1.addChallenge({
                message: 'acceptMessage' as MessageCypher,
                publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                approve: true,
              }),
            }),
            Effect.result
          )
          expect(errorResponse._tag).toBe('Success')
        })
      )
    })

    it('without a prior request', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user2.authHeaders)
          const errorResponse = yield* pipe(
            client.Inboxes.approveRequest({
              headers: commonHeaders,
              payload: yield* user2.inbox1.addChallenge({
                message: 'acceptMessage' as MessageCypher,
                publicKeyToConfirm: user1.inbox1.keyPair.publicKeyPemBase64,
                approve: true,
              }),
            }),
            Effect.result
          )
          expect(errorResponse._tag).toBe('Success')
        })
      )
    })

    it('Sender inbox is not found', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user2.authHeaders)
          const errorResponse = yield* pipe(
            client.Inboxes.approveRequest({
              headers: commonHeaders,
              payload: yield* user2.inbox1.addChallenge({
                message: 'acceptMessage' as MessageCypher,
                publicKeyToConfirm: generatePrivateKey().publicKeyPemBase64,
                approve: true,
              }),
            }),
            Effect.result
          )
          expectErrorResponse(SenderInboxDoesNotExistError)(errorResponse)
        })
      )
    })

    it('receiver inbox is not found', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* () {
          const client = yield* NodeTestingApp

          yield* setAuthHeaders(user2.authHeaders)
          const errorResponse = yield* pipe(
            client.Inboxes.approveRequest({
              headers: commonHeaders,
              payload: yield* addChallengeForKey(
                generatePrivateKey(),
                user1.authHeaders
              )({
                message: 'acceptMessage' as MessageCypher,
                publicKeyToConfirm: user2.inbox1.keyPair.publicKeyPemBase64,
                approve: true,
              }),
            }),
            Effect.result
          )
          expectErrorResponse(ReceiverInboxDoesNotExistError)(errorResponse)
        })
      )
    })
  })
})
