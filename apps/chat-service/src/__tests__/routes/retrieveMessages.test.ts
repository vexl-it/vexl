import {Effect, Schema} from 'effect'
import {runPromiseInMockedEnvironment} from '../utils/runPromiseInMockedEnvironment'

import {SqlClient} from '@effect/sql'
import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {type MessageCypher} from '@vexl-next/domain/src/general/messaging'
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
