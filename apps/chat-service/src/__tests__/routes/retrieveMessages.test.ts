import {Effect, Schema} from 'effect'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {
  MessageCypher,
  MessageType,
} from '@vexl-next/domain/src/general/messaging'
import {CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {type SendMessageRequest} from '@vexl-next/rest-api/src/services/chat/contracts'
import {InboxDoesNotExistError} from '@vexl-next/rest-api/src/services/contact/contracts'
import {expectErrorResponse} from '@vexl-next/server-utils/src/tests/expectErrorResponse'
import {setAuthHeaders} from '@vexl-next/server-utils/src/tests/nodeTestingApp'
import {hashPublicKey} from '../../db/domain'
import {addChallengeForKey} from '../utils/addChallengeForKey'
import {
  createMockedUser,
  makeTestCommonAndSecurityHeaders,
  type MockedUser,
} from '../utils/createMockedUser'
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
    })
  )
})

describe('Retrieve messages', () => {
  it('Correctly receives messages in inbox', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user2.inbox1.addChallenge({
            message: 'someMessage3' as MessageCypher,
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
        const messagesForUser1 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          })
        )
        expect(messagesForUser1.messages.map((one) => one.message)).toEqual([
          'someMessage2',
          'someMessage3',
        ])
        expect(
          messagesForUser1.messages.find(
            (one) => one.message === 'someMessage3'
          )?.receivedByServerAt
        ).toBeDefined()
      })
    )
  })

  it('Returns legacy messages without receivedByServerAt', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user2.inbox1.addChallenge({
            message: 'legacyMessage' as MessageCypher,
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

        const sql = yield* _(SqlClient.SqlClient)
        yield* _(sql`
          UPDATE message
          SET
            received_by_server_at = NULL
          WHERE
            message = 'legacyMessage'
        `)

        yield* _(setAuthHeaders(user1.authHeaders))
        const messagesForUser1 = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          })
        )

        expect(
          messagesForUser1.messages.find(
            (one) => one.message === 'legacyMessage'
          )?.receivedByServerAt
        ).toBeUndefined()
      })
    )
  })

  it('Correctly updates inbox metadata', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user2.inbox1.addChallenge({
            message: 'someMessage3' as MessageCypher,
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
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/2 (1.0.0) IOS',
            }),
          })
        )

        const inboxHash = yield* _(
          hashPublicKey(user1.mainKeyPair.publicKeyPemBase64)
        )
        const sql = yield* _(SqlClient.SqlClient)
        const data = yield* _(sql`
          SELECT
            *
          FROM
            inbox
          WHERE
            public_key = ${inboxHash}
        `)
        expect(data[0].platform).toBe('IOS')
        expect(data[0].clientVersion).toBe(2)
      })
    )
  })

  it('Does not mark messages as pulled when markAsPulled is false', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user2.inbox1.addChallenge({
            message: Schema.decodeSync(MessageCypher)(
              'messageRetrievedWithoutPull'
            ),
            messageType: Schema.decodeSync(MessageType)('MESSAGE'),
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
        const messagesWithoutPulling = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(
              user1.addChallengeForMainInbox({markAsPulled: false})
            ),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          })
        )
        expect(
          messagesWithoutPulling.messages.map((one) => one.message)
        ).toContain('messageRetrievedWithoutPull')

        yield* _(
          client.Inboxes.deletePulledMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
          })
        )

        // Message was not marked as pulled so it must still be retrievable
        const messagesAfterDelete = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          })
        )
        expect(
          messagesAfterDelete.messages.map((one) => one.message)
        ).toContain('messageRetrievedWithoutPull')

        // The previous retrieve marked it as pulled so now it gets deleted
        yield* _(
          client.Inboxes.deletePulledMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
          })
        )
        const messagesAfterSecondDelete = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(user1.addChallengeForMainInbox({})),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          })
        )
        expect(
          messagesAfterSecondDelete.messages.map((one) => one.message)
        ).not.toContain('messageRetrievedWithoutPull')
      })
    )
  })

  it('Read-only retrieve (markAsPulled false) works without a Vexl user-agent and does not touch inbox metadata', async () => {
    // Mirrors the iOS notification service extension: it sends no Vexl
    // user-agent and no client-version header (clientVersionOrNone resolves
    // to Option.none()), so the handler must not run updateInboxMetadata -
    // otherwise it would write NULL into the NOT NULL client_version column
    // and the whole request would fail with a 500.
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)

        const messageToSend = (yield* _(
          user2.inbox1.addChallenge({
            message: Schema.decodeSync(MessageCypher)('messageRetrievedByNse'),
            messageType: Schema.decodeSync(MessageType)('MESSAGE'),
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
        const messages = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(
              user1.addChallengeForMainInbox({markAsPulled: false})
            ),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'VexlNSE/1 CFNetwork/1494.0.7 Darwin/23.4.0',
            }),
          })
        )
        expect(messages.messages.map((one) => one.message)).toContain(
          'messageRetrievedByNse'
        )

        // Message must not be marked as pulled by the read-only retrieve.
        const sql = yield* _(SqlClient.SqlClient)
        const messageRows = yield* _(sql`
          SELECT
            pulled
          FROM
            message
          WHERE
            message = 'messageRetrievedByNse'
        `)
        expect(messageRows[0]?.pulled).toBe(false)

        // Inbox metadata must stay untouched (NOT NULL column intact).
        const inboxHash = yield* _(
          hashPublicKey(user1.mainKeyPair.publicKeyPemBase64)
        )
        const inboxRows = yield* _(sql`
          SELECT
            client_version
          FROM
            inbox
          WHERE
            public_key = ${inboxHash}
        `)
        expect(inboxRows[0]?.clientVersion).not.toBeNull()
      })
    )
  })

  it('Retruns an error when inbox does not exist', async () => {
    await runPromiseInMockedEnvironment(
      Effect.gen(function* (_) {
        const client = yield* _(NodeTestingApp)
        yield* _(setAuthHeaders(user1.authHeaders))

        const errorResponse = yield* _(
          client.Messages.retrieveMessages({
            payload: yield* _(
              addChallengeForKey(generatePrivateKey(), user1.authHeaders)({})
            ),
            headers: Schema.decodeSync(CommonHeaders)({
              'user-agent': 'Vexl/1 (1.0.0) ANDROID',
            }),
          }),
          Effect.either
        )

        expectErrorResponse(InboxDoesNotExistError)(errorResponse)
      })
    )
  })
})
