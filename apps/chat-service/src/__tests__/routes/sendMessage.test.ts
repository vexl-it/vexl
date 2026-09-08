import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  ReceiverInboxDoesNotExistError,
  SenderInboxDoesNotExistError,
  type SendMessageRequest,
} from '@vexl-next/rest-api/src/services/chat/contracts'
import {ForbiddenMessageTyperror} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {mockedReportMetric} from '@vexl-next/server-utils/src/tests/mockedMetricsClientService'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import dayjs from 'dayjs'
import {Effect, pipe, Schema} from 'effect'
import {SqlClient} from 'effect/unstable/sql'
import {
  messageExpirationLowerLimitDaysConfig,
  messageExpirationUpperLimitDaysConfig,
} from '../../configs'
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

      const sql = yield* SqlClient.SqlClient
      yield* sql`DELETE FROM message`
    })
  )
})

describe('Send message', () => {
  it('Sends message from user1 to user2', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const messageToSend = (yield* user1.addChallengeForMainInbox({
          message: 'someMessage' as MessageCypher,
          messageType: 'MESSAGE' as const,
          receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
        })) satisfies SendMessageRequest

        yield* setAuthHeaders(user1.authHeaders)
        const sendMessageResponse = yield* client.Messages.sendMessage({
          headers: commonHeaders,
          payload: messageToSend,
        })
        expect(sendMessageResponse.receivedByServerAt).toBeDefined()

        yield* setAuthHeaders(user2.authHeaders)
        const messagesReceived = yield* client.Messages.retrieveMessages({
          payload: yield* user2.inbox1.addChallenge({}),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
        })

        expect(messagesReceived.messages.length).toBe(1)
        expect(messagesReceived.messages[0].message).toBe('someMessage')
        expect(messagesReceived.messages[0].receivedByServerAt).toBeDefined()

        const messagesReceived2 = yield* client.Messages.retrieveMessages({
          payload: yield* user2.inbox2.addChallenge({}),
          headers: Schema.decodeSync(CommonHeaders)({
            'user-agent': 'Vexl/2 (1.0.0) IOS',
          }),
        })

        expect(messagesReceived2.messages.length).toBe(0)
      })
    )
  })

  it('Sets expires_at properly when sending a message', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const messageToSend = (yield* user1.addChallengeForMainInbox({
          message: 'someMessageABC' as MessageCypher,
          messageType: 'MESSAGE' as const,
          receiverPublicKey: user2.inbox1.keyPair.publicKeyPemBase64,
        })) satisfies SendMessageRequest

        yield* setAuthHeaders(user1.authHeaders)
        yield* client.Messages.sendMessage({
          headers: commonHeaders,
          payload: messageToSend,
        })

        const sql = yield* SqlClient.SqlClient
        const messages = yield* sql`
          SELECT
            *
          FROM
            message
          WHERE
            message = 'someMessageABC'
        `
        const expiresAt = new Date(messages[0].expiresAt as any)
        expect(messages[0].expiresAt).not.toBeNull()
        expect(messages[0].receivedByServerAt).not.toBeNull()

        const lowerLimit = yield* messageExpirationLowerLimitDaysConfig
        const upperLimit = yield* messageExpirationUpperLimitDaysConfig

        dayjs(expiresAt).isAfter(dayjs().add(lowerLimit - 1, 'days'))
        dayjs(expiresAt).isBefore(dayjs().add(upperLimit + 1, 'days'))
      })
    )
  })

  it('Throws correct error when Receiver inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const messageToSend = (yield* user1.addChallengeForMainInbox({
          message: 'cancelMessage' as MessageCypher,
          messageType: 'MESSAGE' as const,
          receiverPublicKey: generatePrivateKey().publicKeyPemBase64,
        })) satisfies SendMessageRequest

        yield* setAuthHeaders(user1.authHeaders)
        const response = yield* pipe(
          client.Messages.sendMessage({
            headers: commonHeaders,
            payload: messageToSend,
          }),
          Effect.result
        )

        expectErrorResponse(ReceiverInboxDoesNotExistError)(response)
      })
    )
  })

  it('Throws correct error when sender inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const messageToSend = (yield* addChallengeForKey(
          generatePrivateKey(),
          user1.authHeaders
        )({
          message: 'cancelMessage' as MessageCypher,
          messageType: 'MESSAGE' as const,
          receiverPublicKey: user2.inbox3.keyPair.publicKeyPemBase64,
        })) satisfies SendMessageRequest

        yield* setAuthHeaders(user1.authHeaders)
        const response = yield* pipe(
          client.Messages.sendMessage({
            headers: commonHeaders,
            payload: messageToSend,
          }),
          Effect.result
        )

        expectErrorResponse(SenderInboxDoesNotExistError)(response)
      })
    )
  })

  it('sends a message without prior approval', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const messageToSend = (yield* user1.addChallengeForMainInbox({
          message: 'cancelMessage' as MessageCypher,
          messageType: 'MESSAGE' as const,
          receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
        })) satisfies SendMessageRequest

        yield* setAuthHeaders(user1.authHeaders)
        const response = yield* pipe(
          client.Messages.sendMessage({
            headers: commonHeaders,
            payload: messageToSend,
          }),
          Effect.result
        )

        expect(response._tag).toBe('Success')
      })
    )
  })

  it('allows handshake message types and rejects local-only messages', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* () {
        const client = yield* NodeTestingApp

        const messageToSend = yield* user1.addChallengeForMainInbox({
          message: 'cancelMessage' as MessageCypher,
          receiverPublicKey: user2.inbox2.keyPair.publicKeyPemBase64,
        })

        yield* setAuthHeaders(user1.authHeaders)
        mockedReportMetric.mockClear()
        yield* client.Messages.sendMessage({
          headers: commonHeaders,
          payload: {...messageToSend, messageType: 'REQUEST_MESSAGING'},
        })
        yield* client.Messages.sendMessage({
          headers: commonHeaders,
          payload: {...messageToSend, messageType: 'APPROVE_MESSAGING'},
        })
        yield* client.Messages.sendMessage({
          headers: commonHeaders,
          payload: {...messageToSend, messageType: 'DISAPPROVE_MESSAGING'},
        })
        yield* client.Messages.sendMessage({
          headers: commonHeaders,
          payload: {
            ...messageToSend,
            messageType: 'CANCEL_REQUEST_MESSAGING',
          },
        })
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({name: 'REQUEST_SENT', value: 1})
        )
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({name: 'REQUEST_APPROVED', value: 1})
        )
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({name: 'REQUEST_REJECTED', value: 1})
        )
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({name: 'REQUEST_CANCELED', value: 1})
        )

        mockedReportMetric.mockClear()
        yield* client.Messages.sendMessage({
          headers: commonHeaders,
          payload: {...messageToSend, messageType: 'MESSAGE'},
        })
        expect(mockedReportMetric).toHaveBeenCalledWith(
          expect.objectContaining({name: 'MESSAGE_SENT'})
        )
        expect(mockedReportMetric).not.toHaveBeenCalledWith(
          expect.objectContaining({name: 'REQUEST_SENT'})
        )

        const response = yield* pipe(
          client.Messages.sendMessage({
            headers: commonHeaders,
            payload: {
              ...messageToSend,
              messageType: 'INACTIVITY_REMINDER',
            },
          }),
          Effect.result
        )

        expectErrorResponse(ForbiddenMessageTyperror)(response)
      })
    )
  })
})
