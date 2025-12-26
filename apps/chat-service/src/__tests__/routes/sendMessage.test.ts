import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  type SendMessageRequest,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {
  ForbiddenMessageTyperror,
  NotPermittedToSendMessageToTargetInboxError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import dayjs from 'dayjs'
import {Effect, Schema} from 'effect'
import {
  messageExpirationLowerLimitDaysConfig,
  messageExpirationUpperLimitDaysConfig,
} from '../../configs'
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
            message: 'cancelMessage' as MessageCypher,
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
              message: 'someMessage2' as MessageCypher,
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

describe('Send message', () => {
  it('Sends message from user1 to user2', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user1.addChallengeForMainInbox({
            message: 'someMessage' as MessageCypher,
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
        expect(messagesReceived.messages[0].message).toBe('someMessage')

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

  it('Sets expires_at properly when sending a message', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user1.addChallengeForMainInbox({
            message: 'someMessageABC' as MessageCypher,
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

        const sql = yield* _(SqlClient.SqlClient)
        const messages = yield* _(sql`
          SELECT
            *
          FROM
            message
          WHERE
            message = 'someMessageABC'
        `)
        const expiresAt = new Date(messages[0].expiresAt as any)
        expect(messages[0].expiresAt).not.toBeNull()

        const lowerLimit = yield* _(messageExpirationLowerLimitDaysConfig)
        const upperLimit = yield* _(messageExpirationUpperLimitDaysConfig)

        dayjs(expiresAt).isAfter(dayjs().add(lowerLimit - 1, 'days'))
        dayjs(expiresAt).isBefore(dayjs().add(upperLimit + 1, 'days'))
      })
    )
  })

  it('Throws correct error when Receiver inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user1.addChallengeForMainInbox({
            message: 'cancelMessage' as MessageCypher,
            messageType: 'MESSAGE' as const,
            receiverPublicKey: generatePrivateKey().publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        yield* _(setAuthHeaders(user1.authHeaders))
        const response = yield* _(
          client.Messages.sendMessage({
            payload: messageToSend,
          }),
          Effect.either
        )

        expectErrorResponse(ReceiverInboxDoesNotExistError)(response)
      })
    )
  })

  it('Throws correct error when sender inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          addChallengeForKey(
            generatePrivateKey(),
            user1.authHeaders
          )({
            message: 'cancelMessage' as MessageCypher,
            messageType: 'MESSAGE' as const,
            receiverPublicKey: user2.inbox3.keyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        yield* _(setAuthHeaders(user1.authHeaders))
        const response = yield* _(
          client.Messages.sendMessage({
            payload: messageToSend,
          }),
          Effect.either
        )

        expectErrorResponse(SenderInboxDoesNotExistError)(response)
      })
    )
  })

  it('Throws correct error when not permitted to send message to target inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user1.addChallengeForMainInbox({
            message: 'cancelMessage' as MessageCypher,
            messageType: 'MESSAGE' as const,
            receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        yield* _(setAuthHeaders(user2.authHeaders))
        const response = yield* _(
          client.Messages.sendMessage({
            payload: messageToSend,
          }),
          Effect.either
        )

        expectErrorResponse(NotPermittedToSendMessageToTargetInboxError)(
          response
        )
      })
    )
  })

  it('Can not send message of type that is generated by BE', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = yield* _(
          user1.addChallengeForMainInbox({
            message: 'cancelMessage' as MessageCypher,
            receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
          })
        )

        yield* _(setAuthHeaders(user2.authHeaders))
        const response = yield* _(
          client.Messages.sendMessage({
            payload: {...messageToSend, messageType: 'REQUEST_MESSAGING'},
          }),
          Effect.either
        )

        expectErrorResponse(ForbiddenMessageTyperror)(response)

        const response2 = yield* _(
          client.Messages.sendMessage({
            payload: {...messageToSend, messageType: 'APPROVE_MESSAGING'},
          }),
          Effect.either
        )

        expectErrorResponse(ForbiddenMessageTyperror)(response2)

        const response3 = yield* _(
          client.Messages.sendMessage({
            payload: {...messageToSend, messageType: 'DISAPPROVE_MESSAGING'},
          }),
          Effect.either
        )

        expectErrorResponse(ForbiddenMessageTyperror)(response3)

        const response4 = yield* _(
          client.Messages.sendMessage({
            payload: {
              ...messageToSend,
              messageType: 'CANCEL_REQUEST_MESSAGING',
            },
          }),
          Effect.either
        )

        expectErrorResponse(ForbiddenMessageTyperror)(response4)
      })
    )
  })
})
