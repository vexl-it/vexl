import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  type SendMessageRequest,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {NotPermittedToSendMessageToTargetInboxError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {Effect, Schema} from 'effect'
import {addChallengeForKey} from '../utils/addChallengeForKey'
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
            message: 'cancelMessage' as MessageCypher,
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
              message: 'someMessage2' as MessageCypher,
              publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
              approve: true,
            })
          ),
        })
      )

      // Will send message user2 -> user1
      const messageToSend = (yield* _(
        user2.inbox1.addChallenge({
          message: 'cancelMessage' as MessageCypher,
          messageType: 'MESSAGE' as const,
          receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
        })
      )) satisfies SendMessageRequest

      yield* _(
        client.Messages.sendMessage({
          payload: messageToSend,
        })
      )

      yield* _(sql`DELETE FROM message`)
    })
  )
})

describe('Leave chat', () => {
  it('Leaves chat, removes whitelist records, sends message to other party about leaving', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        yield* _(setAuthHeaders(user2.authHeaders))
        yield* _(
          client.Inboxes.leaveChat({
            payload: yield* _(
              user2.inbox1.addChallenge({
                message: 'leaveMessage' as MessageCypher,
                receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
              })
            ),
          })
        )

        const sql = yield* _(SqlClient.SqlClient)
        const whitelistRecords = yield* _(sql`
          SELECT
            *
          FROM
            white_list
        `)
        expect(whitelistRecords).toHaveLength(0)

        yield* _(setAuthHeaders(user1.authHeaders))
        const messagesForUser1 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )

        expect(messagesForUser1.messages[0].message).toEqual('leaveMessage')
      })
    )
  })

  describe('it fails when', () => {
    it('Reciever inbox does not exist', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          yield* _(setAuthHeaders(user2.authHeaders))
          const failedResponse = yield* _(
            client.Inboxes.leaveChat({
              payload: yield* _(
                user2.inbox1.addChallenge({
                  message: 'leaveMessage' as MessageCypher,
                  receiverPublicKey: generatePrivateKey().publicKeyPemBase64,
                })
              ),
            }),
            Effect.either
          )

          expectErrorResponse(ReceiverInboxDoesNotExistError)(failedResponse)
        })
      )
    })

    it('Sender inbox does not exist', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          yield* _(setAuthHeaders(user2.authHeaders))
          const failedResponse = yield* _(
            client.Inboxes.leaveChat({
              payload: yield* _(
                addChallengeForKey(
                  generatePrivateKey(),
                  user2.authHeaders
                )({
                  message: 'leaveMessage' as MessageCypher,
                  receiverPublicKey: user1.mainKeyPair.publicKeyPemBase64,
                })
              ),
            }),
            Effect.either
          )

          expectErrorResponse(SenderInboxDoesNotExistError)(failedResponse)
        })
      )
    })

    it('Not permitted to send messages to each other', async () => {
      await runPromiseInMockedEnvironment(
        Effect.gen(function* (_) {
          const client = yield* _(NodeTestingApp)

          yield* _(setAuthHeaders(user2.authHeaders))
          const failedResponse = yield* _(
            client.Inboxes.leaveChat({
              payload: yield* _(
                user2.inbox1.addChallenge({
                  message: 'leaveMessage' as MessageCypher,
                  receiverPublicKey: user1.inbox1.keyPair.publicKeyPemBase64,
                })
              ),
            }),
            Effect.either
          )

          expectErrorResponse(NotPermittedToSendMessageToTargetInboxError)(
            failedResponse
          )
        })
      )
    })
  })
})
