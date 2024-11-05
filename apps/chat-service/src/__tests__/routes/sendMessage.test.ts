import {HttpClientRequest} from '@effect/platform'
import {Schema} from '@effect/schema'
import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  type SendMessageRequest,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {
  ForbiddenMessageTypeError,
  NotPermittedToSendMessageToTargetInboxError,
} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import dayjs from 'dayjs'
import {Effect} from 'effect'
import {
  messageExpirationLowerLimitDaysConfig,
  messageExpirationUpperLimitDaysConfig,
} from '../../configs'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {createMockedUser, type MockedUser} from '../utils/createMockedUser'
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

      yield* _(
        client.requestApproval(
          {
            body: {
              message: 'someMessage',
              publicKey: user2.inbox1.keyPair.publicKeyPemBase64,
            },
          },
          HttpClientRequest.setHeaders(user1.authHeaders)
        )
      )

      yield* _(
        client.approveRequest(
          {
            body: yield* _(
              user2.inbox1.addChallenge({
                message: 'someMessage2',
                publicKeyToConfirm: user1.mainKeyPair.publicKeyPemBase64,
                approve: true,
              })
            ),
          },
          HttpClientRequest.setHeaders(user2.authHeaders)
        )
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
            message: 'someMessage',
            messageType: 'MESSAGE' as const,
            receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        yield* _(
          client.sendMessage(
            {
              body: messageToSend,
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
        )

        const messagesReceived = yield* _(
          client.retrieveMessages(
            {
              body: yield* _(user2.inbox1.addChallenge({})),
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/2 (1.0.0) IOS',
              }),
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
        )

        expect(messagesReceived.messages.length).toBe(1)
        expect(messagesReceived.messages[0].message).toBe('someMessage')

        const messagesReceived2 = yield* _(
          client.retrieveMessages(
            {
              body: yield* _(user2.inbox2.addChallenge({})),
              headers: Schema.decodeSync(CommonHeaders)({
                'user-agent': 'Vexl/2 (1.0.0) IOS',
              }),
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          )
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
            message: 'someMessageABC',
            messageType: 'MESSAGE' as const,
            receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        yield* _(
          client.sendMessage(
            {
              body: messageToSend,
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          )
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
            message: 'someMessage',
            messageType: 'MESSAGE' as const,
            receiverPublicKey: generatePrivateKey().publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        const response = yield* _(
          client.sendMessage(
            {
              body: messageToSend,
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
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
            message: 'someMessage',
            messageType: 'MESSAGE' as const,
            receiverPublicKey: user2.inbox3.keyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        const response = yield* _(
          client.sendMessage(
            {
              body: messageToSend,
            },
            HttpClientRequest.setHeaders(user1.authHeaders)
          ),
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
            message: 'someMessage',
            messageType: 'MESSAGE' as const,
            receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
          })
        )) satisfies SendMessageRequest

        const response = yield* _(
          client.sendMessage(
            {
              body: messageToSend,
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          ),
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
            message: 'someMessage',
            receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
          })
        )

        const response = yield* _(
          client.sendMessage(
            {
              body: {...messageToSend, messageType: 'REQUEST_MESSAGING'},
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          ),
          Effect.either
        )

        expectErrorResponse(ForbiddenMessageTypeError)(response)

        const response2 = yield* _(
          client.sendMessage(
            {
              body: {...messageToSend, messageType: 'APPROVE_MESSAGING'},
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          ),
          Effect.either
        )

        expectErrorResponse(ForbiddenMessageTypeError)(response2)

        const response3 = yield* _(
          client.sendMessage(
            {
              body: {...messageToSend, messageType: 'DISAPPROVE_MESSAGING'},
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          ),
          Effect.either
        )

        expectErrorResponse(ForbiddenMessageTypeError)(response3)

        const response4 = yield* _(
          client.sendMessage(
            {
              body: {...messageToSend, messageType: 'CANCEL_REQUEST_MESSAGING'},
            },
            HttpClientRequest.setHeaders(user2.authHeaders)
          ),
          Effect.either
        )

        expectErrorResponse(ForbiddenMessageTypeError)(response4)
      })
    )
  })
})
